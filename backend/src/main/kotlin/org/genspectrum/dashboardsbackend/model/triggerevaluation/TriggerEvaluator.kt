package org.genspectrum.dashboardsbackend.model.triggerevaluation

import org.genspectrum.dashboardsbackend.api.Subscription
import org.genspectrum.dashboardsbackend.api.Trigger
import org.genspectrum.dashboardsbackend.api.TriggerEvaluationResult
import org.genspectrum.dashboardsbackend.log
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component

@Component
class TriggerEvaluator(
    private val lapisClientProvider: LapisClientProvider,
) {
    fun evaluate(subscription: Subscription): TriggerEvaluationResult {
        val lapisClient = lapisClientProvider.provide(subscription.organism)

        // TODO: add dateWindow

        val lapisRequest = when (subscription.trigger) {
            is Trigger.CountTrigger -> subscription.trigger.filter
            is Trigger.ProportionTrigger -> TODO("proportion triggers are not implemented yet - #81")
        }

        val lapisResponse = lapisClient.aggregated(lapisRequest)

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
                when (lapisResponse.data[0].count > subscription.trigger.count) {
                    true -> TriggerEvaluationResult.ConditionMet
                    false -> TriggerEvaluationResult.ConditionNotMet
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
