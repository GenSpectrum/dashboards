package org.genspectrum.dashboardsbackend.subscriptions

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import io.swagger.v3.oas.annotations.media.Schema
import org.genspectrum.dashboardsbackend.subscriptions.Trigger.CountTrigger
import org.genspectrum.dashboardsbackend.subscriptions.Trigger.ProportionTrigger

enum class DateWindow {
    @JsonProperty("last6Months")
    LAST_6_MONTHS,
}

enum class Organism {
    @JsonProperty("covid")
    COVID,

    @JsonProperty("h5n1")
    H5N1,

    @JsonProperty("mpox")
    MPOX,

    @JsonProperty("westNile")
    WEST_NILE,

    @JsonProperty("rsvA")
    RSV_A,

    @JsonProperty("rsvB")
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
        val baselineFilter: LapisFilter,
        val variantFilter: LapisFilter,
    ) : Trigger {
        val type: ProportionTriggerType = ProportionTriggerType.PROPORTION
    }
}

typealias LapisFilter = Map<String, String>

interface BaseSubscription {
    val name: String?
    val interval: EvaluationInterval?
    val organism: Organism?
    val dateWindow: DateWindow?
    val trigger: Trigger?
}

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
    "trigger": {"type": "countTrigger", "count": 100, "filter": {"country": "Germany", "division": "Berlin"}}
}   
""",
)
data class Subscription(
    val id: String,
    override val name: String,
    override val interval: EvaluationInterval,
    val active: Boolean,
    override val organism: Organism,
    override val dateWindow: DateWindow,
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
    "trigger": {"type": "countTrigger", "count": 100, "filter": {"country": "Germany", "division": "Berlin"}}
}   
""",
)
data class SubscriptionRequest(
    override val name: String,
    override val interval: EvaluationInterval,
    override val organism: Organism,
    override val dateWindow: DateWindow,
    override val trigger: Trigger,
) : BaseSubscription

@Schema(
    description = "A subscription update request",
    example = """
{
    "name": "Subscription name",
    "interval": "daily",
    "organism": "covid",
    "dateWindow": "last6Months",
    "trigger": {"type": "countTrigger", "count": 100, "filter": {"country": "Germany", "division": "Berlin"}}
}   
""",
)
data class SubscriptionUpdate(
    override val name: String? = null,
    override val interval: EvaluationInterval? = null,
    override val organism: Organism? = null,
    override val dateWindow: DateWindow? = null,
    override val trigger: Trigger? = null,
) : BaseSubscription
