package org.genspectrum.dashboardsbackend.model

import org.genspectrum.dashboardsbackend.subscriptions.Trigger
import org.jetbrains.exposed.sql.Table

const val SUBSCRIPTION_TABLE = "subscriptions_table"

object SubscriptionTable : Table(SUBSCRIPTION_TABLE) {
    val id = varchar("id", 255)
    val name = text("name")
    val interval = varchar("interval", 255)
    val active = bool("active")
    val conditionsMet = bool("conditions_met")
    val organism = varchar("organism", 255)
    val dateWindow = varchar("date_window", 255)
    val filter = jacksonSerializableJsonb<Map<String, String>>("filter")
    val trigger = jacksonSerializableJsonb<Trigger>("trigger")

    override val primaryKey = PrimaryKey(id)
}
