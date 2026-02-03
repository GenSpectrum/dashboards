package org.genspectrum.dashboardsbackend.api

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import io.swagger.v3.oas.annotations.media.Schema
import org.genspectrum.dashboardsbackend.api.Trigger.CountTrigger
import org.genspectrum.dashboardsbackend.api.Trigger.ProportionTrigger

enum class DateWindow {
    @JsonProperty("last6Months")
    LAST_6_MONTHS,
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
    JsonSubTypes.Type(value = CountTrigger::class, name = "count"),
    JsonSubTypes.Type(value = ProportionTrigger::class, name = "proportion"),
)
@Schema(
    description = "Base class for different types of triggers",
)
sealed interface Trigger {
    enum class CountTriggerType {
        @JsonProperty("count")
        COUNT,
    }

    enum class ProportionTriggerType {
        @JsonProperty("proportion")
        PROPORTION,
    }

    @Schema(description = "A trigger that is triggered when a certain count is reached")
    data class CountTrigger @JsonCreator constructor(
        val count: Int,
        val filter: LapisFilter,
    ) : Trigger {
        val type: CountTriggerType = CountTriggerType.COUNT
    }

    @Schema(description = "A trigger that is triggered when a certain count is reached")
    data class ProportionTrigger @JsonCreator constructor(
        val proportion: Double,
        val numeratorFilter: LapisFilter,
        val denominatorFilter: LapisFilter,
    ) : Trigger {
        val type: ProportionTriggerType = ProportionTriggerType.PROPORTION
    }
}

typealias LapisFilter = Map<String, String>

@Schema(
    description = "A subscription",
    example = """
{
    "id": "abcd",
    "name": "Subscription name",
    "interval": "daily",
    "active": true,
    "organism": "covid",
    "dateWindow": "last6Months",
    "trigger": {"type": "count", "count": 100, "filter": {"country": "Germany", "division": "Berlin"}}
}   
""",
)
data class Subscription(
    val id: String,
    val name: String,
    val interval: EvaluationInterval,
    val active: Boolean,
    val organism: String,
    val dateWindow: DateWindow,
    val trigger: Trigger,
)

@Schema(
    description = "A subscription request",
    example = """
{
    "name": "Subscription name",
    "interval": "daily",
    "organism": "covid",
    "dateWindow": "last6Months",
    "trigger": {"type": "count", "count": 100, "filter": {"country": "Germany", "division": "Berlin"}}
}   
""",
)
data class SubscriptionRequest(
    val name: String,
    val interval: EvaluationInterval,
    val organism: String,
    val dateWindow: DateWindow,
    val trigger: Trigger,
    val active: Boolean,
)

@Schema(
    description = "A subscription update request",
    example = """
{
    "name": "Subscription name",
    "interval": "daily",
    "organism": "covid",
    "dateWindow": "last6Months",
    "trigger": {"type": "count", "count": 100, "filter": {"country": "Germany", "division": "Berlin"}}
}   
""",
)
data class SubscriptionUpdate(
    val name: String? = null,
    val interval: EvaluationInterval? = null,
    val organism: String? = null,
    val dateWindow: DateWindow? = null,
    val trigger: Trigger? = null,
    val active: Boolean? = null,
)
