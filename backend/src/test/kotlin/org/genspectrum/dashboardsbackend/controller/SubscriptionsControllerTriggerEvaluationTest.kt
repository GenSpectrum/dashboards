package org.genspectrum.dashboardsbackend.controller

import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import io.mockk.mockk
import org.genspectrum.dashboardsbackend.api.Organism
import org.genspectrum.dashboardsbackend.api.Trigger
import org.genspectrum.dashboardsbackend.model.triggerevaluation.AggregatedData
import org.genspectrum.dashboardsbackend.model.triggerevaluation.LapisAggregatedResponse
import org.genspectrum.dashboardsbackend.model.triggerevaluation.LapisClient
import org.genspectrum.dashboardsbackend.model.triggerevaluation.LapisClientProvider
import org.genspectrum.dashboardsbackend.model.triggerevaluation.LapisError
import org.genspectrum.dashboardsbackend.model.triggerevaluation.LapisInfo
import org.genspectrum.dashboardsbackend.model.triggerevaluation.LapisResponse
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.http.HttpStatusCode
import org.springframework.http.MediaType
import org.springframework.http.ProblemDetail
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.content
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@SpringBootTest
@AutoConfigureMockMvc
@Import(SubscriptionsClient::class)
class SubscriptionsControllerTriggerEvaluationTest(
    @Autowired private val subscriptionsClient: SubscriptionsClient,
) {
    @MockkBean
    private lateinit var lapisClientProviderMock: LapisClientProvider

    val countTrigger = Trigger.CountTrigger(
        count = 30,
        filter = emptyMap(),
    )

    @Test
    fun `GIVEN lapis returns count greater than threshold WHEN evaluating trigger THEN returns condition met`() {
        val userId = getNewUserId()

        val createdSubscription = subscriptionsClient.postSubscription(
            subscription = dummySubscriptionRequest.copy(trigger = countTrigger),
            userId = userId
        )

        mockLapisResponse(Organism.COVID, LapisAggregatedResponse(listOf(AggregatedData(40)), LapisInfo()))

        subscriptionsClient
            .evaluateTriggerRaw(
                userId = userId,
                subscriptionId = createdSubscription.id,
            )
            .andExpect(status().isOk)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("\$.result.type").value("ConditionMet"))
            .andExpect(jsonPath("\$.result.evaluatedValue").value(40))
            .andExpect(jsonPath("\$.result.threshold").value(30))
    }

    @Test
    fun `GIVEN lapis returns count less than threshold WHEN evaluating trigger THEN returns condition not met`() {
        val userId = getNewUserId()

        val createdSubscription = subscriptionsClient.postSubscription(
            subscription = dummySubscriptionRequest.copy(trigger = countTrigger),
            userId = userId
        )

        mockLapisResponse(Organism.COVID, LapisAggregatedResponse(listOf(AggregatedData(20)), LapisInfo()))

        subscriptionsClient
            .evaluateTriggerRaw(
                userId = userId,
                subscriptionId = createdSubscription.id,
            )
            .andExpect(status().isOk)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("\$.result.type").value("ConditionNotMet"))
            .andExpect(jsonPath("\$.result.evaluatedValue").value(20))
            .andExpect(jsonPath("\$.result.threshold").value(30))
    }

    @Test
    fun `GIVEN lapis returns error WHEN evaluating trigger THEN returns evaluation error`() {
        val userId = getNewUserId()

        val createdSubscription = subscriptionsClient.postSubscription(dummySubscriptionRequest, userId)

        mockLapisResponse(
            Organism.COVID,
            LapisError(
                ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(456), "dummy LAPIS error"),
                LapisInfo(),
            ),
        )

        subscriptionsClient
            .evaluateTriggerRaw(
                userId = userId,
                subscriptionId = createdSubscription.id,
            )
            .andExpect(status().isOk)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("\$.result.type").value("EvaluationError"))
            .andExpect(jsonPath("\$.result.statusCode").value(456))
            .andExpect(jsonPath("\$.result.message").value("dummy LAPIS error"))
    }

    fun mockLapisResponse(organism: Organism, lapisResponse: LapisResponse) {
        val lapisClientMock = mockk<LapisClient>()
        every { lapisClientMock.aggregated(any()) }.returns(lapisResponse)

        every { lapisClientProviderMock.provide(organism) }.returns(lapisClientMock)
    }
}
