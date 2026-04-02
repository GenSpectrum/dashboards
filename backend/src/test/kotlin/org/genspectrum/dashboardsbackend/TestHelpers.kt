package org.genspectrum.dashboardsbackend

import org.genspectrum.dashboardsbackend.api.CollectionRequest
import org.genspectrum.dashboardsbackend.api.DateWindow
import org.genspectrum.dashboardsbackend.api.EvaluationInterval
import org.genspectrum.dashboardsbackend.api.SubscriptionRequest
import org.genspectrum.dashboardsbackend.api.Trigger
import org.genspectrum.dashboardsbackend.api.VariantRequest

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

val dummyQueryVariantRequest = VariantRequest.QueryVariantRequest(
    name = "BA.2 in USA",
    description = "BA.2 lineage cases in USA",
    countQuery = "country='USA' & lineage='BA.2'",
    coverageQuery = "country='USA'",
)

val dummyFilterObjectVariantRequest = VariantRequest.FilterObjectVariantRequest(
    name = "Omicron mutations",
    description = "Key mutations",
    filterObject = org.genspectrum.dashboardsbackend.api.FilterObject().apply {
        aminoAcidMutations = listOf("S:N501Y", "S:E484K", "S:K417N")
    },
)

val dummyCollectionRequest = CollectionRequest(
    name = "Test Collection",
    organism = KnownTestOrganisms.Covid.name,
    description = "Test collection description",
    variants = listOf(dummyQueryVariantRequest, dummyFilterObjectVariantRequest),
)
