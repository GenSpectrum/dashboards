package org.genspectrum.dashboardsbackend.model.triggerevaluation

import org.genspectrum.dashboardsbackend.api.DateWindow
import org.genspectrum.dashboardsbackend.api.EvaluationInterval
import org.genspectrum.dashboardsbackend.api.Organism
import org.genspectrum.dashboardsbackend.api.Subscription
import org.genspectrum.dashboardsbackend.api.Trigger
import org.genspectrum.dashboardsbackend.api.TriggerEvaluationResult
import org.hamcrest.CoreMatchers.`is`
import org.hamcrest.MatcherAssert.assertThat
import org.junit.jupiter.api.Test
import org.mockserver.client.MockServerClient
import org.mockserver.model.HttpRequest.request
import org.mockserver.model.HttpResponse.response
import org.mockserver.model.MediaType
import org.mockserver.springtest.MockServerTest
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest

@SpringBootTest(
    properties = [
        "dashboards.covid.lapisUrl=http://localhost:\${mockServerPort}/covid",
        "dashboards.h5n1.lapisUrl=http://localhost:\${mockServerPort}/h5n1",
        "dashboards.mpox.lapisUrl=http://localhost:\${mockServerPort}/mpox",
        "dashboards.westNile.lapisUrl=http://localhost:\${mockServerPort}/westNile",
        "dashboards.rsvA.lapisUrl=http://localhost:\${mockServerPort}/rsvA",
        "dashboards.rsvB.lapisUrl=http://localhost:\${mockServerPort}/rsvB",
    ],
)
@MockServerTest
class TriggerEvaluatorTest(
    @Autowired private val underTest: TriggerEvaluator,
) {
    private lateinit var mockServerClient: MockServerClient

    @Test
    fun `GIVEN ___`() { // TODO test title
        mockServerClient
            .`when`(
                request()
                    .withMethod("POST")
                    .withPath("/westNile/sample/aggregated")
                    .withContentType(MediaType.APPLICATION_JSON)
                    .withBody(
                        """{"country":"Germany","division":"Berlin"}""".trimIndent(),
                    ),
            )
            .respond(
                response()
                    .withStatusCode(200)
                    .withBody(
                        """
                            {
                                "data": [
                                    {
                                        "count": 101
                                    }
                                ],
                                "info": {
                                    "dataVersion": "a data version"
                                }
                            }
                        """.trimIndent(),
                    ),
            )

        val subscription = Subscription(
            id = "id",
            name = "test",
            interval = EvaluationInterval.WEEKLY,
            active = true,
            organism = Organism.WEST_NILE,
            dateWindow = DateWindow.LAST_6_MONTHS,
            trigger = Trigger.CountTrigger(
                count = 100,
                filter = mapOf(
                    "country" to "Germany",
                    "division" to "Berlin",
                ),
            ),
        )

        val result = underTest.evaluate(subscription)

        assertThat(result, `is`(TriggerEvaluationResult.ConditionMet))
    }
}
