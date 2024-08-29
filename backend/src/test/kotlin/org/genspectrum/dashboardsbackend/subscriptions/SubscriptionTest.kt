package org.genspectrum.dashboardsbackend.subscriptions

import com.fasterxml.jackson.databind.ObjectMapper
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
        val underTest =
            Subscription(
                id = "someId",
                name = "Test Subscription",
                active = true,
                conditionsMet = true,
                organism = Organism.COVID,
                interval = EvaluationInterval.WEEKLY,
                dateWindow = DateWindow.LAST_6_MONTHS,
                filter = mapOf(
                    "someFilter" to "value1",
                    "someOtherFilter" to "value2",
                ),
                trigger = CountTrigger(10),
            )

        val result = objectMapper.writeValueAsString(underTest)

        val expected =
            """
            {
              "id": "someId",
              "name": "Test Subscription",
              "interval": "weekly",
              "active": true,
              "conditionsMet": true,
              "organism": "covid",
              "dateWindow": "last6Months",
              "filter": {
                "someFilter": "value1",
                "someOtherFilter": "value2"
              },
              "trigger": {
                "type": "countTrigger",
                "count": 10
              }
            }
            """.trimIndent()

        assertThat(objectMapper.readTree(result), equalTo(objectMapper.readTree(expected)))
    }
}
