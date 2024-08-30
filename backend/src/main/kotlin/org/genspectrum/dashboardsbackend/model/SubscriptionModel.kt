package org.genspectrum.dashboardsbackend.model

import org.genspectrum.dashboardsbackend.subscriptions.DateWindow
import org.genspectrum.dashboardsbackend.subscriptions.EvaluationInterval
import org.genspectrum.dashboardsbackend.subscriptions.Organism
import org.genspectrum.dashboardsbackend.subscriptions.Subscription
import org.genspectrum.dashboardsbackend.subscriptions.SubscriptionRequest
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
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

    fun getSubscriptions(): List<Subscription> {
        val table = SubscriptionTable

        return table.selectAll().map {
            Subscription(
                id = it[table.id],
                name = it[table.name],
                filter = it[table.filter],
                interval = enumValueOf<EvaluationInterval>(it[table.interval]),
                dateWindow = enumValueOf<DateWindow>(it[table.dateWindow]),
                trigger = it[table.trigger],
                organism = enumValueOf<Organism>(it[table.organism]),
                active = it[table.active],
                conditionsMet = it[table.conditionsMet],
            )
        }
    }

    fun postSubscriptions(request: SubscriptionRequest) {
        val table = SubscriptionTable

        table.insert {
            it[id] = UUID.randomUUID().toString()
            it[name] = request.name
            it[filter] = request.filter
            it[interval] = request.interval.name
            it[dateWindow] = request.dateWindow.name
            it[trigger] = request.trigger
            it[organism] = request.organism.name
            it[active] = true
            it[conditionsMet] = false
        }
    }
}
