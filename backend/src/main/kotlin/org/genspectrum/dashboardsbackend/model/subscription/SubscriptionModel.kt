package org.genspectrum.dashboardsbackend.model.subscription

import org.genspectrum.dashboardsbackend.api.Subscription
import org.genspectrum.dashboardsbackend.api.SubscriptionRequest
import org.genspectrum.dashboardsbackend.api.SubscriptionUpdate
import org.genspectrum.dashboardsbackend.config.DashboardsConfig
import org.genspectrum.dashboardsbackend.controller.BadRequestException
import org.genspectrum.dashboardsbackend.controller.NotFoundException
import org.jetbrains.exposed.sql.Database
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID
import javax.sql.DataSource

@Service
@Transactional
class SubscriptionModel(pool: DataSource, private val dashboardsConfig: DashboardsConfig) {
    init {
        Database.connect(pool)
    }

    fun getSubscription(subscriptionId: String, userId: String): Subscription =
        SubscriptionEntity.findForUser(convertToUuid(subscriptionId), userId)
            ?.toSubscription()
            ?: throw NotFoundException("Subscription $subscriptionId not found")

    fun getSubscriptions(userId: String): List<Subscription> = SubscriptionEntity.find {
        SubscriptionTable.userId eq userId
    }.map {
        it.toSubscription()
    }

    fun postSubscriptions(request: SubscriptionRequest, userId: String): Subscription {
        validateIsValidOrganism(request.organism)

        return SubscriptionEntity
            .new {
                name = request.name
                interval = request.interval.name
                dateWindow = request.dateWindow.name
                trigger = request.trigger
                organism = request.organism
                active = request.active
                this.userId = userId
            }
            .toSubscription()
    }

    fun deleteSubscription(subscriptionId: String, userId: String) {
        val subscription = SubscriptionEntity.findForUser(convertToUuid(subscriptionId), userId)
            ?: throw NotFoundException("Subscription $subscriptionId not found")

        subscription.delete()
    }

    fun putSubscription(subscriptionId: String, subscriptionUpdate: SubscriptionUpdate, userId: String): Subscription {
        subscriptionUpdate.organism?.also { validateIsValidOrganism(it) }

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
            subscription.organism = subscriptionUpdate.organism
        }
        if (subscriptionUpdate.active != null) {
            subscription.active = subscriptionUpdate.active
        }

        return subscription.toSubscription()
    }

    private fun validateIsValidOrganism(organism: String) {
        if (!dashboardsConfig.organisms.containsKey(organism)) {
            throw BadRequestException("Organism '$organism' is not supported")
        }
    }

    private fun convertToUuid(id: String) = try {
        UUID.fromString(id)
    } catch (_: IllegalArgumentException) {
        throw BadRequestException("Invalid UUID $id")
    }
}
