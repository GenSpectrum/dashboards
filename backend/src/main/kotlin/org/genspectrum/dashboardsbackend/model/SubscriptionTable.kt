package org.genspectrum.dashboardsbackend.model

import org.genspectrum.dashboardsbackend.subscriptions.Subscription
import org.genspectrum.dashboardsbackend.subscriptions.Trigger
import org.jetbrains.exposed.dao.UUIDEntity
import org.jetbrains.exposed.dao.UUIDEntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.UUIDTable
import java.util.UUID

const val SUBSCRIPTION_TABLE = "subscriptions_table"

object SubscriptionTable : UUIDTable(SUBSCRIPTION_TABLE) {
    val name = text("name")
    val interval = varchar("interval", 255)
    val active = bool("active")
    val conditionsMet = bool("conditions_met")
    val organism = varchar("organism", 255)
    val dateWindow = varchar("date_window", 255)
    val filter = jacksonSerializableJsonb<Map<String, String>>("filter")
    val trigger = jacksonSerializableJsonb<Trigger>("trigger")
    val userId = varchar("user_id", 255)
}

class SubscriptionEntity(id: EntityID<UUID>) : UUIDEntity(id) {
    companion object : UUIDEntityClass<SubscriptionEntity>(SubscriptionTable) {
        fun findForUser(id: UUID, userId: String) = SubscriptionEntity.findById(id)
            ?.takeIf { it.userId == userId }
    }

    var name by SubscriptionTable.name
    var interval by SubscriptionTable.interval
    var active by SubscriptionTable.active
    var conditionsMet by SubscriptionTable.conditionsMet
    var organism by SubscriptionTable.organism
    var dateWindow by SubscriptionTable.dateWindow
    var filter by SubscriptionTable.filter
    var trigger by SubscriptionTable.trigger
    var userId by SubscriptionTable.userId

    fun toSubscription() = Subscription(
        id = id.value.toString(),
        name = name,
        interval = enumValueOf(interval),
        active = active,
        conditionsMet = conditionsMet,
        organism = enumValueOf(organism),
        dateWindow = enumValueOf(dateWindow),
        filter = filter,
        trigger = trigger,
    )
}
