package org.genspectrum.dashboardsbackend.model

import org.genspectrum.dashboardsbackend.subscriptions.Subscription
import org.genspectrum.dashboardsbackend.subscriptions.SubscriptionRequest
import org.springframework.stereotype.Service
import java.util.UUID
import java.util.concurrent.CopyOnWriteArrayList

@Service
class SubscriptionModel {
    val inMemorySubscriptions = CopyOnWriteArrayList<Subscription>()

    fun getSubscriptions(): List<Subscription> {
        return inMemorySubscriptions
    }

    fun postSubscriptions(request: SubscriptionRequest) {
        inMemorySubscriptions.add(
            Subscription(
                id = UUID.randomUUID().toString(),
                name = request.name,
                filter = request.filter,
                interval = request.interval,
                dateWindow = request.dateWindow,
                trigger = request.trigger,
                organism = request.organism,
                active = true,
                conditionsMet = false,
            ),
        )
    }
}
