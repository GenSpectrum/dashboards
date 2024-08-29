package org.genspectrum.dashboardsbackend.subscriptions

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import io.swagger.v3.oas.annotations.media.Schema

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
@Schema(
    description = "Base class for different types of triggers",
    oneOf = [CountTrigger::class],
)
sealed class Trigger

@Schema(description = "A trigger that is triggered when a certain count is reached")
data class CountTrigger @JsonCreator constructor(
    @JsonProperty("count") val count: Int,
    @Schema(
        description = "The type of trigger",
        example = "countTrigger",
        allowableValues = ["countTrigger"],
    )
    @JsonProperty("type") val type: String = "countTrigger",
) : Trigger()

typealias LapisFilter = Map<String, String>

interface BaseSubscription {
    val name: String
    val interval: EvaluationInterval
    val organism: Organism
    val dateWindow: DateWindow
    val filter: LapisFilter
    val trigger: Trigger
}

@Schema(
    description = "A subscription",
    example = """
{
    "id": "abcd",
    "name": "Subscription name",
    "interval": "daily",
    "active": true,
    "conditionsMet": true,
    "organism": "covid",
    "dateWindow": "last6Months",
    "filter": {"country": "Germany", "division": "Berlin"},
    "trigger": {"type": "countTrigger", "count": 100}
}   
""",
)
data class Subscription(
    val id: String,
    override val name: String,
    override val interval: EvaluationInterval,
    val active: Boolean,
    val conditionsMet: Boolean,
    override val organism: Organism,
    override val dateWindow: DateWindow,
    override val filter: LapisFilter,
    override val trigger: Trigger,
) : BaseSubscription

@Schema(
    description = "A subscription request",
    example = """
{
    "name": "Subscription name",
    "interval": "daily",
    "organism": "covid",
    "dateWindow": "last6Months",
    "filter": {"country": "Germany", "division": "Berlin"},
    "trigger": {"type": "countTrigger", "count": 100}
}   
""",
)
data class SubscriptionRequest(
    override val name: String,
    override val interval: EvaluationInterval,
    override val organism: Organism,
    override val dateWindow: DateWindow,
    override val filter: LapisFilter,
    override val trigger: Trigger,
) : BaseSubscription
