package org.genspectrum.dashboardsbackend.model

import org.genspectrum.dashboardsbackend.controller.BadRequestException
import org.genspectrum.dashboardsbackend.controller.NotFoundException
import org.genspectrum.dashboardsbackend.subscriptions.Subscription
import org.genspectrum.dashboardsbackend.subscriptions.SubscriptionRequest
import org.jetbrains.exposed.sql.Database
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID
import javax.sql.DataSource

@Service
@Transactional
class SubscriptionModel(
    pool: DataSource,
) {
    init {
        Database.connect(pool)
    }

    fun getSubscription(id: String): Subscription {
        return SubscriptionEntity.findById(convertToUuid(id))
            ?.toSubscription()
            ?: throw NotFoundException("Subscription $id not found")
    }

    fun getSubscriptions(): List<Subscription> {
        return SubscriptionEntity.all().map { it.toSubscription() }
    }

    fun postSubscriptions(request: SubscriptionRequest) = SubscriptionEntity
        .new {
            name = request.name
            filter = request.filter
            interval = request.interval.name
            dateWindow = request.dateWindow.name
            trigger = request.trigger
            organism = request.organism.name
            active = true
            conditionsMet = false
        }
        .toSubscription()

    fun deleteSubscription(id: String) {
        val subscription = SubscriptionEntity.findById(convertToUuid(id))
            ?: throw NotFoundException("Subscription $id not found")

        subscription.delete()
    }

    private fun convertToUuid(id: String) = try {
        UUID.fromString(id)
    } catch (e: IllegalArgumentException) {
        throw BadRequestException("Invalid UUID $id")
    }
}
