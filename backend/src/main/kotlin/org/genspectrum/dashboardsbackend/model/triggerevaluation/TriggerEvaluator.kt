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
        val additionalFilters = additionalFilters(subscription.organism)

        val computation = when (subscription.trigger) {
            is Trigger.CountTrigger -> CountComputation(
                subscription = subscription,
                lapisClient = lapisClient,
                lapisFilter = subscription.trigger.filter + dateFilter + additionalFilters,
                threshold = subscription.trigger.count,
            )

            is Trigger.ProportionTrigger -> ProportionComputation(
                subscription = subscription,
                lapisClient = lapisClient,
                numeratorFilter = subscription.trigger.numeratorFilter + dateFilter + additionalFilters,
                denominatorFilter = subscription.trigger.denominatorFilter + dateFilter + additionalFilters,
                threshold = subscription.trigger.proportion,
            )
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

    private fun additionalFilters(organism: String): Map<String, String> {
        return dashboardsConfig.getOrganismConfig(organism).lapis.additionalFilters ?: emptyMap()
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
        return when (val lapisResponse = lapisClient.aggregated(lapisFilter)) {
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

private class ProportionComputation(
    private val subscription: Subscription,
    private val lapisClient: LapisClient,
    private val numeratorFilter: Map<String, String>,
    private val denominatorFilter: Map<String, String>,
    private val threshold: Double,
) : TriggerComputation {
    override fun evaluate(): TriggerEvaluationResult {
        val numeratorResponse = lapisClient.aggregated(numeratorFilter)
        val denominatorResponse = lapisClient.aggregated(denominatorFilter)

        val numeratorCount = when (numeratorResponse) {
            is LapisAggregatedResponse -> {
                if (numeratorResponse.data.isEmpty()) {
                    log.error {
                        "No data in numerator response $numeratorResponse for subscription $subscription. " +
                            "This should never happen."
                    }
                    return TriggerEvaluationResult.EvaluationError(
                        message = "No data in numerator response",
                        statusCode = HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    )
                }
                numeratorResponse.data[0].count
            }

            is LapisError -> return TriggerEvaluationResult.EvaluationError(
                message = numeratorResponse.error.detail ?: "Unknown error",
                statusCode = numeratorResponse.error.status,
            )

            is LapisNotReachableError -> return TriggerEvaluationResult.EvaluationError(
                message = numeratorResponse.message,
                statusCode = HttpStatus.INTERNAL_SERVER_ERROR.value(),
            )
        }

        val denominatorCount = when (denominatorResponse) {
            is LapisAggregatedResponse -> {
                if (denominatorResponse.data.isEmpty()) {
                    log.error {
                        "No data in denominator response $denominatorResponse for subscription $subscription. " +
                            "This should never happen."
                    }
                    return TriggerEvaluationResult.EvaluationError(
                        message = "No data in denominator response",
                        statusCode = HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    )
                }
                denominatorResponse.data[0].count
            }

            is LapisError -> return TriggerEvaluationResult.EvaluationError(
                message = denominatorResponse.error.detail ?: "Unknown error",
                statusCode = denominatorResponse.error.status,
            )

            is LapisNotReachableError -> return TriggerEvaluationResult.EvaluationError(
                message = denominatorResponse.message,
                statusCode = HttpStatus.INTERNAL_SERVER_ERROR.value(),
            )
        }

        // TODO(#156): reevaluate this condition after we understand the use cases better
        if (denominatorCount == 0) {
            return TriggerEvaluationResult.ConditionNotMet(
                evaluatedValue = null,
                threshold = threshold,
                lapisDataVersion = numeratorResponse.info.dataVersion,
            )
        }

        val evaluatedValue = numeratorCount.toDouble() / denominatorCount

        return when (evaluatedValue > threshold) {
            true -> TriggerEvaluationResult.ConditionMet(
                evaluatedValue = evaluatedValue,
                threshold = threshold,
                lapisDataVersion = numeratorResponse.info.dataVersion,
            )

            false -> TriggerEvaluationResult.ConditionNotMet(
                evaluatedValue = evaluatedValue,
                threshold = threshold,
                lapisDataVersion = numeratorResponse.info.dataVersion,
            )
        }
    }
}
