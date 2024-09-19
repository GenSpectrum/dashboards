package org.genspectrum.dashboardsbackend.model.triggerevaluation

import org.genspectrum.dashboardsbackend.api.DateWindow
import org.genspectrum.dashboardsbackend.api.EvaluationInterval
import org.genspectrum.dashboardsbackend.api.Organism
import org.genspectrum.dashboardsbackend.api.Subscription
import org.genspectrum.dashboardsbackend.api.Trigger
import org.genspectrum.dashboardsbackend.api.TriggerEvaluationResult
import org.hamcrest.CoreMatchers.`is`
import org.hamcrest.MatcherAssert.assertThat
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.MethodSource
import org.mockserver.client.MockServerClient
import org.mockserver.model.HttpRequest
import org.mockserver.model.HttpRequest.request
import org.mockserver.model.HttpResponse
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
        "dashboards.westNile.lapisUrl=http://localhost:\${mockServerPort}/west_nile",
        "dashboards.rsvA.lapisUrl=http://localhost:\${mockServerPort}/rsv_a",
        "dashboards.rsvB.lapisUrl=http://localhost:\${mockServerPort}/rsv_b",
    ],
)
@MockServerTest
class TriggerEvaluatorTest(
    @Autowired private val underTest: TriggerEvaluator,
) {
    private lateinit var mockServerClient: MockServerClient

    @ParameterizedTest
    @MethodSource("getOrganisms")
    fun `GIVEN lapis returns count above count trigger threshold THEN returns condition met`(organism: Organism) {
        mockServerClient
            .`when`(
                requestingAggregatedDataWith(
                    organism = organism,
                    body = """{"country":"Germany","division":"Berlin"}""".trimIndent(),
                ),
            )
            .respond(withSuccessResponse(count = 101))

        val subscription = makeSubscription(
            organism = organism,
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

    private fun requestingAggregatedDataWith(organism: Organism, body: String): HttpRequest? = request()
        .withMethod("POST")
        .withContentType(MediaType.APPLICATION_JSON)
        .withPath(getAggregatedRoute(organism))
        .withBody(body)

    private fun withSuccessResponse(count: Int): HttpResponse? = response()
        .withStatusCode(200)
        .withBody(
            """
                {
                    "data": [
                        {
                            "count": $count
                        }
                    ],
                    "info": {
                        "dataVersion": "a data version"
                    }
                }
            """.trimIndent(),
        )

    private fun makeSubscription(organism: Organism, trigger: Trigger.CountTrigger) = Subscription(
        id = "id",
        name = "test",
        interval = EvaluationInterval.WEEKLY,
        active = true,
        organism = organism,
        dateWindow = DateWindow.LAST_6_MONTHS,
        trigger = trigger,
    )

    fun getAggregatedRoute(organism: Organism) = "/${organism.name.lowercase()}/sample/aggregated"

    companion object {
        @JvmStatic
        fun getOrganisms() = Organism.entries.toList()
    }
}
