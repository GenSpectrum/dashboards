package org.genspectrum.dashboardsbackend.model.triggerevaluation

import org.genspectrum.dashboardsbackend.api.Subscription
import org.genspectrum.dashboardsbackend.api.Trigger
import org.genspectrum.dashboardsbackend.api.TriggerEvaluationResult
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
            is LapisAggregatedResponse -> when (lapisResponse.data[0].count > subscription.trigger.count) {
                true -> TriggerEvaluationResult.ConditionMet
                false -> TriggerEvaluationResult.ConditionNotMet
            }

            is LapisError -> TODO()
        }
    }
}
