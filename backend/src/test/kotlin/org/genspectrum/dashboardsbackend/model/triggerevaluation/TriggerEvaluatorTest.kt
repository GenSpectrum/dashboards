package org.genspectrum.dashboardsbackend.model.triggerevaluation

import org.genspectrum.dashboardsbackend.api.DateWindow
import org.genspectrum.dashboardsbackend.api.EvaluationInterval
import org.genspectrum.dashboardsbackend.api.Organism
import org.genspectrum.dashboardsbackend.api.Subscription
import org.genspectrum.dashboardsbackend.api.Trigger
import org.genspectrum.dashboardsbackend.api.TriggerEvaluationResult
import org.hamcrest.Matcher
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.allOf
import org.hamcrest.Matchers.containsString
import org.hamcrest.Matchers.hasProperty
import org.hamcrest.Matchers.instanceOf
import org.hamcrest.Matchers.`is`
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.MethodSource
import org.mockserver.client.MockServerClient
import org.mockserver.model.HttpError
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
                    body = """{"country":"Germany","division":"Berlin"}""",
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

    @ParameterizedTest
    @MethodSource("getOrganisms")
    fun `GIVEN lapis returns count lower or equal than count trigger threshold THEN returns condition not met`(
        organism: Organism,
    ) {
        mockServerClient
            .`when`(
                requestingAggregatedDataWith(
                    organism = organism,
                    body = """{"country":"Germany","division":"Berlin"}""",
                ),
            )
            .respond(withSuccessResponse(count = 100))

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

        assertThat(result, `is`(TriggerEvaluationResult.ConditionNotMet))
    }

    @Test
    fun `GIVEN lapis returns empty data array THEN returns evaluation error`() {
        mockServerClient
            .`when`(
                requestingAggregatedDataWith(
                    organism = Organism.WEST_NILE,
                    body = "{}",
                ),
            )
            .respond(
                response()
                    .withStatusCode(200)
                    .withBody(
                        """
                            {
                                "data": [],
                                "info": {
                                    "dataVersion": "a data version"
                                }
                            }
                        """.trimIndent(),
                    ),
            )

        val subscription = makeSubscription(
            organism = Organism.WEST_NILE,
            trigger = Trigger.CountTrigger(
                count = 100,
                filter = emptyMap(),
            ),
        )

        val result = underTest.evaluate(subscription)

        assertThat(result, isEvaluationErrorWithMessage(containsString("empty data")))
    }

    @Test
    fun `WHEN lapis does not respond THEN returns evaluation error`() {
        mockServerClient
            .`when`(request())
            .error(HttpError.error().withDropConnection(true))

        val subscription = makeSubscription(
            organism = Organism.WEST_NILE,
            trigger = Trigger.CountTrigger(
                count = 100,
                filter = emptyMap(),
            ),
        )

        val result = underTest.evaluate(subscription)

        assertThat(result, isEvaluationErrorWithMessage(containsString("Could not connect to LAPIS")))
    }

    private fun isEvaluationErrorWithMessage(messageMatcher: Matcher<String>): Matcher<TriggerEvaluationResult> {
        return allOf(
            instanceOf(TriggerEvaluationResult.EvaluationError::class.java),
            hasProperty("message", messageMatcher),
        )
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
