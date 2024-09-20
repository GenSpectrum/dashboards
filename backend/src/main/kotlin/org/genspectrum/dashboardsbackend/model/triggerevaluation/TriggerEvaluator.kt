package org.genspectrum.dashboardsbackend.model.triggerevaluation

import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.minus
import org.genspectrum.dashboardsbackend.api.DateWindow
import org.genspectrum.dashboardsbackend.api.Subscription
import org.genspectrum.dashboardsbackend.api.Trigger
import org.genspectrum.dashboardsbackend.api.TriggerEvaluationResult
import org.genspectrum.dashboardsbackend.config.DashboardsConfig
import org.genspectrum.dashboardsbackend.log
import org.genspectrum.dashboardsbackend.util.DateProvider
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component

@Component
class TriggerEvaluator(
    private val lapisClientProvider: LapisClientProvider,
    private val dateProvider: DateProvider,
    private val dashboardsConfig: DashboardsConfig,
) {
    fun evaluate(subscription: Subscription): TriggerEvaluationResult {
        val lapisClient = lapisClientProvider.provide(subscription.organism)

        val dateFilter = computeDateFilter(subscription)

        val computation = when (subscription.trigger) {
            is Trigger.CountTrigger -> CountComputation(
                subscription = subscription,
                lapisClient = lapisClient,
                lapisFilter = subscription.trigger.filter + dateFilter,
                threshold = subscription.trigger.count,
            )

            is Trigger.ProportionTrigger -> TODO("proportion triggers are not implemented yet - #81")
        }

        return computation.evaluate()
    }

    private fun computeDateFilter(subscription: Subscription): Map<String, String> {
        val currentDate = dateProvider.getCurrentDate()

        val lowerBoundDate = when (subscription.dateWindow) {
            DateWindow.LAST_6_MONTHS -> currentDate.minus(6, DateTimeUnit.MONTH)
        }

        val dateField = dashboardsConfig.getOrganismConfig(subscription.organism).lapis.mainDateField

        return mapOf(
            "${dateField}From" to "$lowerBoundDate",
            "${dateField}To" to "$currentDate",
        )
    }
}

private interface TriggerComputation {
    fun evaluate(): TriggerEvaluationResult
}

private class CountComputation(
    private val subscription: Subscription,
    private val lapisClient: LapisClient,
    private val lapisFilter: Map<String, String>,
    private val threshold: Int,
) : TriggerComputation {
    override fun evaluate(): TriggerEvaluationResult {
        val lapisResponse = lapisClient.aggregated(lapisFilter)

        return when (lapisResponse) {
            is LapisAggregatedResponse -> {
                if (lapisResponse.data.isEmpty()) {
                    log.error {
                        "No data in response $lapisResponse for subscription $subscription. This should never happen."
                    }
                    return TriggerEvaluationResult.EvaluationError(
                        message = "Could not read LAPIS aggregated response: empty data",
                        statusCode = HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    )
                }
                val evaluatedValue = lapisResponse.data[0].count
                when (evaluatedValue > threshold) {
                    true -> TriggerEvaluationResult.ConditionMet(
                        evaluatedValue = evaluatedValue,
                        threshold = threshold,
                        lapisDataVersion = lapisResponse.info.dataVersion,
                    )

                    false -> TriggerEvaluationResult.ConditionNotMet(
                        evaluatedValue = evaluatedValue,
                        threshold = threshold,
                        lapisDataVersion = lapisResponse.info.dataVersion,
                    )
                }
            }

            is LapisError -> TriggerEvaluationResult.EvaluationError(
                message = lapisResponse.error.detail ?: "Unknown error",
                statusCode = lapisResponse.error.status,
            )

            is LapisNotReachableError -> TriggerEvaluationResult.EvaluationError(
                message = lapisResponse.message,
                statusCode = HttpStatus.INTERNAL_SERVER_ERROR.value(),
            )
        }
    }
}
