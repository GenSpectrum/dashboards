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

    fun getSubscription(id: String, userId: String): Subscription {
        return SubscriptionEntity.findForUser(convertToUuid(id), userId)
            ?.toSubscription()
            ?: throw NotFoundException("Subscription $id not found")
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
            conditionsMet = false
            this.userId = userId
        }
        .toSubscription()

    fun deleteSubscription(id: String, userId: String) {
        val subscription = SubscriptionEntity.findForUser(convertToUuid(id), userId)
            ?: throw NotFoundException("Subscription $id not found")

        subscription.delete()
    }

    fun putSubscription(id: String, request: SubscriptionUpdate, userId: String): Subscription {
        val subscription = SubscriptionEntity.findForUser(convertToUuid(id), userId)
            ?: throw NotFoundException("Subscription $id not found")

        if (request.name != null) {
            subscription.name = request.name
        }
        if (request.interval != null) {
            subscription.interval = request.interval.name
        }
        if (request.dateWindow != null) {
            subscription.dateWindow = request.dateWindow.name
        }
        if (request.trigger != null) {
            subscription.trigger = request.trigger
        }
        if (request.organism != null) {
            subscription.organism = request.organism.name
        }

        return subscription.toSubscription()
    }

    private fun convertToUuid(id: String) = try {
        UUID.fromString(id)
    } catch (_: IllegalArgumentException) {
        throw BadRequestException("Invalid UUID $id")
    }
}
