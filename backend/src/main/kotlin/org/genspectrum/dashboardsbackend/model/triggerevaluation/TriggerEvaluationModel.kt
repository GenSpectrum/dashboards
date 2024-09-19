package org.genspectrum.dashboardsbackend.model.triggerevaluation

import org.genspectrum.dashboardsbackend.model.subscription.SubscriptionModel
import org.springframework.stereotype.Component

@Component
class TriggerEvaluationModel(
    private val subscriptionModel: SubscriptionModel,
    private val triggerEvaluator: TriggerEvaluator,
) {
    fun evaluateSubscriptionTrigger(subscriptionId: String, userId: String) = triggerEvaluator.evaluate(
        subscriptionModel.getSubscription(
            subscriptionId = subscriptionId,
            userId = userId,
        ),
    )
}
