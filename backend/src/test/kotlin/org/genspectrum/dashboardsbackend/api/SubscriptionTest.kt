package org.genspectrum.dashboardsbackend.api

import com.fasterxml.jackson.databind.ObjectMapper
import org.genspectrum.dashboardsbackend.api.Trigger.CountTrigger
import org.genspectrum.dashboardsbackend.api.Trigger.ProportionTrigger
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.equalTo
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest

@SpringBootTest
class SubscriptionTest {
    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Test
    fun `Subscription is correctly serialized to JSON`() {
        val underTest = Subscription(
            id = "someId",
            name = "Test Subscription",
            active = true,
            organism = Organism.Covid,
            interval = EvaluationInterval.WEEKLY,
            dateWindow = DateWindow.LAST_6_MONTHS,
            trigger = CountTrigger(10, emptyMap()),
        )

        val result = objectMapper.writeValueAsString(underTest)

        val expected = """
            {
                "id": "someId",
                "name": "Test Subscription",
                "interval": "weekly",
                "active": true,
                "organism": "covid",
                "dateWindow": "last6Months",
                "trigger": {
                    "type": "count",
                    "count": 10,
                    "filter": {}
                }
            }
        """.trimIndent()

        result.assertDeserializesLike(expected)
    }

    @Test
    fun `Count trigger is serialized correctly to JSON`() {
        val underTest = CountTrigger(
            count = 10,
            filter = mapOf(
                "someFilter" to "value1",
                "someOtherFilter" to "value2",
            ),
        )

        val result = objectMapper.writeValueAsString(underTest)

        val expected = """
            {
                "type": "count",
                "count": 10,
                "filter": {
                    "someFilter": "value1",
                    "someOtherFilter": "value2"
                }
            }
        """.trimIndent()

        result.assertDeserializesLike(expected)
    }

    @Test
    fun `Proportion trigger is serialized correctly to JSON`() {
        val underTest = ProportionTrigger(
            proportion = 0.75,
            baselineFilter = mapOf(
                "someBaselineFilter" to "value1",
                "someOtherBaselineFilter" to "value2",
            ),
            variantFilter = mapOf(
                "someFilter" to "value1",
                "someOtherFilter" to "value2",
            ),
        )

        val result = objectMapper.writeValueAsString(underTest)

        val expected = """
            {
                "type": "proportion",
                "proportion": 0.75,
                "baselineFilter": {
                    "someBaselineFilter": "value1",
                    "someOtherBaselineFilter": "value2"
                },
                "variantFilter": {
                    "someFilter": "value1",
                    "someOtherFilter": "value2"
                }
            }
        """.trimIndent()

        result.assertDeserializesLike(expected)
    }

    private fun String.assertDeserializesLike(expected: String) {
        assertThat(objectMapper.readTree(this), equalTo(objectMapper.readTree(expected)))
    }
}
