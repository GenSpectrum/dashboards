package org.genspectrum.dashboardsbackend.model

import org.genspectrum.dashboardsbackend.subscriptions.Subscription
import org.genspectrum.dashboardsbackend.subscriptions.SubscriptionRequest
import org.jetbrains.exposed.sql.Database
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import javax.sql.DataSource

@Service
@Transactional
class SubscriptionModel(
    pool: DataSource,
) {
    init {
        Database.connect(pool)
    }

    fun getSubscriptions(): List<Subscription> {
        return SubscriptionEntity.all().map { it.toSubscription() }
    }

    fun postSubscriptions(request: SubscriptionRequest) {
        SubscriptionEntity.new {
            name = request.name
            filter = request.filter
            interval = request.interval.name
            dateWindow = request.dateWindow.name
            trigger = request.trigger
            organism = request.organism.name
            active = true
            conditionsMet = false
        }
    }
}
