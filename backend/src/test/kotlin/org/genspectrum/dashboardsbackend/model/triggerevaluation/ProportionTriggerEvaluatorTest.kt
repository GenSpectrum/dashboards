package org.genspectrum.dashboardsbackend.model.triggerevaluation

import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import kotlinx.datetime.LocalDate
import org.genspectrum.dashboardsbackend.KnownTestOrganisms
import org.genspectrum.dashboardsbackend.api.DateWindow
import org.genspectrum.dashboardsbackend.api.EvaluationInterval
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
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.MethodSource
import org.mockserver.client.MockServerClient
import org.mockserver.model.HttpError
import org.mockserver.model.HttpRequest.request
import org.mockserver.model.HttpResponse
import org.mockserver.model.HttpResponse.response
import org.mockserver.model.MediaType
import org.mockserver.springtest.MockServerTest
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest

@SpringBootTest(
    properties = [
        "dashboards.organisms.Covid.lapis.url=http://localhost:\${mockServerPort}/covid",
        "dashboards.organisms.Mpox.lapis.url=http://localhost:\${mockServerPort}/mpox",
        "dashboards.organisms.WestNile.lapis.url=http://localhost:\${mockServerPort}/westnile",
    ],
)
@MockServerTest
class ProportionTriggerEvaluatorTest(
    @Autowired private val underTest: TriggerEvaluator,
) {
    private lateinit var mockServerClient: MockServerClient

    @MockkBean
    private lateinit var dateProviderMock: DateProvider

    val someSubscription = makeSubscriptionWithProportionThreshold(
        organism = KnownTestOrganisms.WestNile.name,
        proportion = 0.1,
    )

    @BeforeEach
    fun mockCurrentDate() {
        every { dateProviderMock.getCurrentDate() } returns LocalDate(2021, 3, 15)
    }

    @ParameterizedTest
    @MethodSource("getOrganisms")
    fun `GIVEN lapis returns proportion above count trigger threshold THEN returns condition met`(organism: String) {
        mockServerClient
            .`when`(requestingNumeratorData(organism))
            .respond(withSuccessResponse(count = 501))
        mockServerClient
            .`when`(requestingDenominatorData(organism))
            .respond(withSuccessResponse(count = 1_000))

        val subscription = makeSubscriptionWithProportionThreshold(
            organism = organism,
            proportion = 0.5,
        )

        val result = underTest.evaluate(subscription)

        assertThat(
            result,
            `is`(
                TriggerEvaluationResult.ConditionMet(
                    evaluatedValue = 0.501,
                    threshold = 0.5,
                    lapisDataVersion = "a data version",
                ),
            ),
        )
    }

    @ParameterizedTest
    @MethodSource("getOrganisms")
    fun `GIVEN lapis returns count lower or equal than count trigger threshold THEN returns condition not met`(
        organism: String,
    ) {
        mockServerClient
            .`when`(requestingNumeratorData(organism))
            .respond(withSuccessResponse(count = 500))
        mockServerClient
            .`when`(requestingDenominatorData(organism))
            .respond(withSuccessResponse(count = 1_000))

        val subscription = makeSubscriptionWithProportionThreshold(
            organism = organism,
            proportion = 0.5,
        )

        val result = underTest.evaluate(subscription)

        assertThat(
            result,
            `is`(
                TriggerEvaluationResult.ConditionNotMet(
                    evaluatedValue = 0.5,
                    threshold = 0.5,
                    lapisDataVersion = "a data version",
                ),
            ),
        )
    }

    @Test
    fun `GIVEN lapis returns 0 for denominator THEN returns condition met`() {
        val organism = KnownTestOrganisms.WestNile.name

        mockServerClient
            .`when`(requestingNumeratorData(organism))
            .respond(withSuccessResponse(count = 1))
        mockServerClient
            .`when`(requestingDenominatorData(organism))
            .respond(withSuccessResponse(count = 0))

        val subscription = makeSubscriptionWithProportionThreshold(
            organism = organism,
            proportion = 0.5,
        )

        val result = underTest.evaluate(subscription)

        assertThat(
            result,
            `is`(
                TriggerEvaluationResult.ConditionNotMet(
                    evaluatedValue = null,
                    threshold = 0.5,
                    lapisDataVersion = "a data version",
                ),
            ),
        )
    }

    @Test
    fun `GIVEN lapis returns 0 for denominator and numerator THEN returns condition not met`() {
        val organism = KnownTestOrganisms.WestNile.name

        mockServerClient
            .`when`(requestingNumeratorData(organism))
            .respond(withSuccessResponse(count = 0))
        mockServerClient
            .`when`(requestingDenominatorData(organism))
            .respond(withSuccessResponse(count = 0))

        val subscription = makeSubscriptionWithProportionThreshold(
            organism = organism,
            proportion = 0.5,
        )

        val result = underTest.evaluate(subscription)

        assertThat(
            result,
            `is`(
                TriggerEvaluationResult.ConditionNotMet(
                    evaluatedValue = null,
                    threshold = 0.5,
                    lapisDataVersion = "a data version",
                ),
            ),
        )
    }

    @Test
    fun `GIVEN lapis returns empty data array for numerator THEN returns evaluation error`() {
        mockServerClient
            .`when`(requestingNumeratorData(someSubscription.organism))
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
        mockServerClient
            .`when`(requestingDenominatorData(someSubscription.organism))
            .respond(withSuccessResponse(count = 1_000))

        val result = underTest.evaluate(someSubscription)

        assertThat(result, isEvaluationErrorWith(message = `is`("No data in numerator response"), statusCode = 500))
    }

    @Test
    fun `GIVEN lapis returns empty data array for denominator THEN returns evaluation error`() {
        mockServerClient
            .`when`(requestingNumeratorData(someSubscription.organism))
            .respond(withSuccessResponse(count = 500))
        mockServerClient
            .`when`(requestingDenominatorData(someSubscription.organism))
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

        assertThat(result, isEvaluationErrorWith(message = `is`("No data in denominator response"), statusCode = 500))
    }

    @Test
    fun `WHEN lapis does not respond for numerator THEN returns evaluation error`() {
        mockServerClient
            .`when`(requestingNumeratorData(someSubscription.organism))
            .error(HttpError.error().withDropConnection(true))
        mockServerClient
            .`when`(requestingDenominatorData(someSubscription.organism))
            .respond(withSuccessResponse(count = 1_000))

        val result = underTest.evaluate(someSubscription)

        assertThat(
            result,
            isEvaluationErrorWith(message = containsString("Could not connect to LAPIS"), statusCode = 500),
        )
    }

    @Test
    fun `WHEN lapis does not respond for denominator THEN returns evaluation error`() {
        mockServerClient
            .`when`(requestingNumeratorData(someSubscription.organism))
            .respond(withSuccessResponse(count = 500))
        mockServerClient
            .`when`(requestingDenominatorData(someSubscription.organism))
            .error(HttpError.error().withDropConnection(true))

        val result = underTest.evaluate(someSubscription)

        assertThat(
            result,
            isEvaluationErrorWith(message = containsString("Could not connect to LAPIS"), statusCode = 500),
        )
    }

    @Test
    fun `WHEN lapis returns HTTP error for numerator THEN returns evaluation error`() {
        mockServerClient
            .`when`(requestingNumeratorData(someSubscription.organism))
            .respond(withErrorResponse())
        mockServerClient
            .`when`(requestingDenominatorData(someSubscription.organism))
            .respond(withSuccessResponse(count = 1_000))

        val result = underTest.evaluate(someSubscription)

        assertThat(result, isEvaluationErrorWith(message = `is`("an error message"), statusCode = 432))
    }

    @Test
    fun `WHEN lapis returns HTTP error for denominator THEN returns evaluation error`() {
        mockServerClient
            .`when`(requestingNumeratorData(someSubscription.organism))
            .respond(withSuccessResponse(count = 500))
        mockServerClient
            .`when`(requestingDenominatorData(someSubscription.organism))
            .respond(withErrorResponse())

        val result = underTest.evaluate(someSubscription)

        assertThat(result, isEvaluationErrorWith(message = `is`("an error message"), statusCode = 432))
    }

    private fun withErrorResponse(): HttpResponse? = response()
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
        )

    private fun requestingNumeratorData(organism: String) = requestingAggregatedDataWith(
        organism = organism,
        body = """
            {
                "numeratorFilterKey": "numeratorFilterValue",
                "${organism.lowercase()}_dateFrom": "2020-09-15",
                "${organism.lowercase()}_dateTo": "2021-03-15",
                "someAdditionalFilter": "${organism.lowercase()}_additional_filter"
            }
        """.replace("\\s".toRegex(), ""),
    )

    private fun requestingDenominatorData(organism: String) = requestingAggregatedDataWith(
        organism = organism,
        body = """
            {
                "denominatorFilterKey": "denominatorFilterValue",
                "${organism.lowercase()}_dateFrom": "2020-09-15",
                "${organism.lowercase()}_dateTo": "2021-03-15",
                "someAdditionalFilter": "${organism.lowercase()}_additional_filter"
            }
        """.replace("\\s".toRegex(), ""),
    )

    private fun isEvaluationErrorWith(message: Matcher<String>, statusCode: Int): Matcher<TriggerEvaluationResult> {
        return allOf(
            instanceOf(TriggerEvaluationResult.EvaluationError::class.java),
            hasProperty("message", message),
            hasProperty("statusCode", `is`(statusCode)),
        )
    }

    private fun requestingAggregatedDataWith(organism: String, body: String) = request()
        .withMethod("POST")
        .withContentType(MediaType.APPLICATION_JSON)
        .withPath(getAggregatedRoute(organism))
        .withBody(body)

    private fun withSuccessResponse(count: Int) = response()
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

    private fun makeSubscriptionWithProportionThreshold(organism: String, proportion: Double) = Subscription(
        id = "id",
        name = "test",
        interval = EvaluationInterval.WEEKLY,
        active = true,
        organism = organism,
        dateWindow = DateWindow.LAST_6_MONTHS,
        trigger = Trigger.ProportionTrigger(
            proportion = proportion,
            numeratorFilter = mapOf(
                "numeratorFilterKey" to "numeratorFilterValue",
            ),
            denominatorFilter = mapOf(
                "denominatorFilterKey" to "denominatorFilterValue",
            ),
        ),
    )

    fun getAggregatedRoute(organism: String) = "/${organism.lowercase()}/sample/aggregated"

    companion object {
        @JvmStatic
        fun getOrganisms() = KnownTestOrganisms.entries.map { it.name }
    }
}
