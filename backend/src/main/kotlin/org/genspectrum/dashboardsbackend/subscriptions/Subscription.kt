package org.genspectrum.dashboardsbackend.subscriptions

import com.fasterxml.jackson.annotation.JsonProperty

enum class DateWindow {
    @JsonProperty("last6Months")
    LAST_6_MONTHS,
}

enum class Organism {
    @JsonProperty("covid")
    COVID,
    H5N1,
    MPOX,

    @JsonProperty("westNile")
    WEST_NILE,

    @JsonProperty("RSV-A")
    RSV_A,

    @JsonProperty("RSV-B")
    RSV_B,
}

enum class EvaluationInterval {
    @JsonProperty("daily")
    DAILY,

    @JsonProperty("weekly")
    WEEKLY,

    @JsonProperty("monthly")
    MONTHLY,
}

sealed class Trigger

data class CountTrigger(val count: Int) : Trigger()

data class Subscription(
    val id: String,
    val name: String,
    val interval: EvaluationInterval,
    val active: Boolean,
    val conditionsMet: Boolean,
    val organism: Organism,
    val dateWindow: DateWindow,
    val filter: Map<String, String>,
    val trigger: Trigger,
)
