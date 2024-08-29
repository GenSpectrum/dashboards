package org.genspectrum.dashboardsbackend.subscriptions

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo

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

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "type",
)
@JsonSubTypes(
    JsonSubTypes.Type(value = CountTrigger::class, name = "countTrigger"),
)
sealed class Trigger

data class CountTrigger @JsonCreator constructor(
    @JsonProperty("count") val count: Int,
) : Trigger()

interface BaseSubscription {
    val name: String
    val interval: EvaluationInterval
    val organism: Organism
    val dateWindow: DateWindow
    val filter: Map<String, String>
    val trigger: Trigger
}

data class Subscription(
    val id: String,
    override val name: String,
    override val interval: EvaluationInterval,
    val active: Boolean,
    val conditionsMet: Boolean,
    override val organism: Organism,
    override val dateWindow: DateWindow,
    override val filter: Map<String, String>,
    override val trigger: Trigger,
) : BaseSubscription

data class SubscriptionRequest(
    override val name: String,
    override val interval: EvaluationInterval,
    override val organism: Organism,
    override val dateWindow: DateWindow,
    override val filter: Map<String, String>,
    override val trigger: Trigger,
) : BaseSubscription
