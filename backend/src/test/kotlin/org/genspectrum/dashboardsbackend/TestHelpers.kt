package org.genspectrum.dashboardsbackend

import org.genspectrum.dashboardsbackend.api.DateWindow
import org.genspectrum.dashboardsbackend.api.EvaluationInterval
import org.genspectrum.dashboardsbackend.api.SubscriptionRequest
import org.genspectrum.dashboardsbackend.api.Trigger

enum class KnownTestOrganisms {
    Covid,
    Mpox,
    WestNile,
}

val dummySubscriptionRequest = SubscriptionRequest(
    name = "My search",
    interval = EvaluationInterval.MONTHLY,
    dateWindow = DateWindow.LAST_6_MONTHS,
    trigger = Trigger.CountTrigger(
        30,
        mapOf(
            "country" to "France",
            "dateFrom" to "2024-01-01",
            "dateTo" to "2024-01-05",
        ),
    ),
    organism = KnownTestOrganisms.Covid.name,
    active = true,
)
