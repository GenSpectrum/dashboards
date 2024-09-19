package org.genspectrum.dashboardsbackend.model

import org.genspectrum.dashboardsbackend.controller.BadRequestException
import org.genspectrum.dashboardsbackend.controller.NotFoundException
import org.genspectrum.dashboardsbackend.subscriptions.Subscription
import org.genspectrum.dashboardsbackend.subscriptions.SubscriptionRequest
import org.genspectrum.dashboardsbackend.subscriptions.SubscriptionUpdate
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

    fun getSubscription(subscriptionId: String, userId: String): Subscription {
        return SubscriptionEntity.findForUser(convertToUuid(subscriptionId), userId)
            ?.toSubscription()
            ?: throw NotFoundException("Subscription $subscriptionId not found")
    }

    fun getSubscriptions(userId: String): List<Subscription> {
        return SubscriptionEntity.find {
            SubscriptionTable.userId eq userId
        }.map {
            it.toSubscription()
        }
    }

    fun postSubscriptions(request: SubscriptionRequest, userId: String) = SubscriptionEntity
        .new {
            name = request.name
            interval = request.interval.name
            dateWindow = request.dateWindow.name
            trigger = request.trigger
            organism = request.organism.name
            active = true
            this.userId = userId
        }
        .toSubscription()

    fun deleteSubscription(subscriptionId: String, userId: String) {
        val subscription = SubscriptionEntity.findForUser(convertToUuid(subscriptionId), userId)
            ?: throw NotFoundException("Subscription $subscriptionId not found")

        subscription.delete()
    }

    fun putSubscription(subscriptionId: String, subscriptionUpdate: SubscriptionUpdate, userId: String): Subscription {
        val subscription = SubscriptionEntity.findForUser(convertToUuid(subscriptionId), userId)
            ?: throw NotFoundException("Subscription $subscriptionId not found")

        if (subscriptionUpdate.name != null) {
            subscription.name = subscriptionUpdate.name
        }
        if (subscriptionUpdate.interval != null) {
            subscription.interval = subscriptionUpdate.interval.name
        }
        if (subscriptionUpdate.dateWindow != null) {
            subscription.dateWindow = subscriptionUpdate.dateWindow.name
        }
        if (subscriptionUpdate.trigger != null) {
            subscription.trigger = subscriptionUpdate.trigger
        }
        if (subscriptionUpdate.organism != null) {
            subscription.organism = subscriptionUpdate.organism.name
        }

        return subscription.toSubscription()
    }

    private fun convertToUuid(id: String) = try {
        UUID.fromString(id)
    } catch (_: IllegalArgumentException) {
        throw BadRequestException("Invalid UUID $id")
    }
}
