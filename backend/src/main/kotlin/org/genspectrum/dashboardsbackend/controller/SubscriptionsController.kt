package org.genspectrum.dashboardsbackend.controller

import org.genspectrum.dashboardsbackend.subscriptions.CountTrigger
import org.genspectrum.dashboardsbackend.subscriptions.DateWindow
import org.genspectrum.dashboardsbackend.subscriptions.EvaluationInterval
import org.genspectrum.dashboardsbackend.subscriptions.Organism
import org.genspectrum.dashboardsbackend.subscriptions.Subscription
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class SubscriptionsController {
    @GetMapping("/subscriptions", produces = [MediaType.APPLICATION_JSON_VALUE])
    fun getSubscriptions(): List<Subscription> {
        return DUMMY_SUBSCRIPTIONS
    }
}

val DUMMY_SUBSCRIPTIONS =
    listOf(
        Subscription(
            id = "1",
            name = "My search",
            filter = mapOf(
                "country" to "Germany",
                "dateFrom" to "2024-01-01",
                "dateTo" to "2024-01-05",
            ),
            interval = EvaluationInterval.WEEKLY,
            dateWindow = DateWindow.LAST_6_MONTHS,
            trigger = CountTrigger(10),
            active = true,
            conditionsMet = true,
            organism = Organism.COVID,
        ),
        Subscription(
            id = "2",
            name = "My other search",
            filter =
            mapOf(
                "country" to "Switzerland",
                "dateFrom" to "2024-01-01",
                "dateTo" to "2024-01-05",
            ),
            interval = EvaluationInterval.DAILY,
            dateWindow = DateWindow.LAST_6_MONTHS,
            trigger = CountTrigger(20),
            active = true,
            conditionsMet = false,
            organism = Organism.COVID,
        ),
        Subscription(
            id = "3",
            name = "My third search",
            filter =
            mapOf(
                "country" to "Germany",
                "dateFrom" to "2024-01-01",
                "dateTo" to "2024-01-05",
            ),
            interval = EvaluationInterval.WEEKLY,
            dateWindow = DateWindow.LAST_6_MONTHS,
            trigger = CountTrigger(13),
            active = true,
            conditionsMet = true,
            organism = Organism.RSV_A,
        ),
    )
