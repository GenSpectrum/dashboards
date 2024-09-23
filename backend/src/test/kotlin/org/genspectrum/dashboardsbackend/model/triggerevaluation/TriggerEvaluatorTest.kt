package org.genspectrum.dashboardsbackend.model.triggerevaluation

import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import kotlinx.datetime.LocalDate
import org.genspectrum.dashboardsbackend.api.DateWindow
import org.genspectrum.dashboardsbackend.api.EvaluationInterval
import org.genspectrum.dashboardsbackend.api.Organism
import org.genspectrum.dashboardsbackend.api.Subscription
import org.genspectrum.dashboardsbackend.api.Trigger
import org.genspectrum.dashboardsbackend.api.TriggerEvaluationResult
import org.genspectrum.dashboardsbackend.util.DateProvider
import org.hamcrest.Matcher
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.allOf
import org.hamcrest.Matchers.containsString
import org.hamcrest.Matchers.hasProperty
import org.hamcrest.Matchers.instanceOf
import org.hamcrest.Matchers.`is`
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
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
        "dashboards.organisms.covid.lapis.url=http://localhost:\${mockServerPort}/covid",
        "dashboards.organisms.h5n1.lapis.url=http://localhost:\${mockServerPort}/h5n1",
        "dashboards.organisms.mpox.lapis.url=http://localhost:\${mockServerPort}/mpox",
        "dashboards.organisms.westNile.lapis.url=http://localhost:\${mockServerPort}/westnile",
        "dashboards.organisms.rsvA.lapis.url=http://localhost:\${mockServerPort}/rsva",
        "dashboards.organisms.rsvB.lapis.url=http://localhost:\${mockServerPort}/rsvb",
    ],
)
@MockServerTest
class TriggerEvaluatorTest(
    @Autowired private val underTest: TriggerEvaluator,
) {
    private lateinit var mockServerClient: MockServerClient

    @MockkBean
    private lateinit var dateProviderMock: DateProvider

    val someSubscription = makeSubscription(
        organism = Organism.WestNile,
        trigger = Trigger.CountTrigger(
            count = 100,
            filter = emptyMap(),
        ),
    )

    @BeforeEach
    fun mockCurrentDate() {
        every { dateProviderMock.getCurrentDate() } returns LocalDate(2021, 3, 15)
    }

    @ParameterizedTest
    @MethodSource("getOrganisms")
    fun `GIVEN lapis returns count above count trigger threshold THEN returns condition met`(organism: Organism) {
        mockServerClient
            .`when`(
                requestingAggregatedDataWith(
                    organism = organism,
                    body = """
                        {
                            "country": "Germany",
                            "division": "Berlin",
                            "${organism.name.lowercase()}_dateFrom": "2020-09-15",
                            "${organism.name.lowercase()}_dateTo": "2021-03-15"
                        }
                    """.replace("\\s".toRegex(), ""),
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

        assertThat(
            result,
            `is`(
                TriggerEvaluationResult.ConditionMet(
                    evaluatedValue = 101,
                    threshold = 100,
                    lapisDataVersion = "a data version",
                ),
            ),
        )
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
                    body = """
                        {
                            "country": "Germany",
                            "division": "Berlin",
                            "${organism.name.lowercase()}_dateFrom": "2020-09-15",
                            "${organism.name.lowercase()}_dateTo": "2021-03-15"
                        }
                    """.replace("\\s".toRegex(), ""),
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

        assertThat(
            result,
            `is`(
                TriggerEvaluationResult.ConditionNotMet(
                    evaluatedValue = 100,
                    threshold = 100,
                    lapisDataVersion = "a data version",
                ),
            ),
        )
    }

    @Test
    fun `GIVEN lapis returns empty data array THEN returns evaluation error`() {
        mockServerClient
            .`when`(request())
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

        val result = underTest.evaluate(someSubscription)

        assertThat(result, isEvaluationErrorWith(message = containsString("empty data"), statusCode = 500))
    }

    @Test
    fun `WHEN lapis does not respond THEN returns evaluation error`() {
        mockServerClient
            .`when`(request())
            .error(HttpError.error().withDropConnection(true))

        val result = underTest.evaluate(someSubscription)

        assertThat(
            result,
            isEvaluationErrorWith(message = containsString("Could not connect to LAPIS"), statusCode = 500),
        )
    }

    @Test
    fun `WHEN lapis returns malformed response THEN throws`() {
        mockServerClient
            .`when`(request())
            .respond(
                response()
                    .withStatusCode(200)
                    .withBody(
                        """
                            {
                                "unexpectedKey": "I should not be deserializable"
                            }
                        """.trimIndent(),
                    ),
            )

        val exception = assertThrows<RuntimeException> { underTest.evaluate(someSubscription) }

        assertThat(exception.message, containsString("Failed to deserialize response from LAPIS"))
    }

    @Test
    fun `WHEN lapis returns HTTP error THEN returns evaluation error`() {
        mockServerClient
            .`when`(request())
            .respond(
                response()
                    .withStatusCode(432)
                    .withBody(
                        """
                            {
                                "error": {
                                    "status": 432,
                                    "detail": "an error message"
                                },
                                "info": {
                                    "dataVersion": "a data version"
                                }
                            }
                        """.trimIndent(),
                    ),
            )

        val result = underTest.evaluate(someSubscription)

        assertThat(result, isEvaluationErrorWith(message = `is`("an error message"), statusCode = 432))
    }

    @Test
    fun `WHEN lapis returns malformed error response THEN throws`() {
        mockServerClient
            .`when`(request())
            .respond(
                response()
                    .withStatusCode(432)
                    .withBody(
                        """
                            {
                                "unexpectedKey": "I should not be deserializable"
                            }
                        """.trimIndent(),
                    ),
            )

        val exception = assertThrows<RuntimeException> { underTest.evaluate(someSubscription) }

        assertThat(exception.message, containsString("Failed to deserialize error response from LAPIS"))
    }

    private fun isEvaluationErrorWith(message: Matcher<String>, statusCode: Int): Matcher<TriggerEvaluationResult> {
        return allOf(
            instanceOf(TriggerEvaluationResult.EvaluationError::class.java),
            hasProperty("message", message),
            hasProperty("statusCode", `is`(statusCode)),
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
