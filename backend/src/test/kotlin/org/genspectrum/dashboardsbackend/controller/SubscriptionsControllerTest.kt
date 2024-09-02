package org.genspectrum.dashboardsbackend.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.genspectrum.dashboardsbackend.subscriptions.CountTrigger
import org.genspectrum.dashboardsbackend.subscriptions.DateWindow
import org.genspectrum.dashboardsbackend.subscriptions.EvaluationInterval
import org.genspectrum.dashboardsbackend.subscriptions.Organism
import org.genspectrum.dashboardsbackend.subscriptions.Subscription
import org.genspectrum.dashboardsbackend.subscriptions.SubscriptionRequest
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.content
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@SpringBootTest
@AutoConfigureMockMvc
class SubscriptionsControllerTest(
    @Autowired val mockMvc: MockMvc,
    @Autowired val objectMapper: ObjectMapper,
) {
    @Test
    fun `After a POST subscriptions it can be retrieved again through GET subscriptions`() {
        val request = SubscriptionRequest(
            name = "My search",
            filter = mapOf(
                "country" to "France",
                "dateFrom" to "2024-01-01",
                "dateTo" to "2024-01-05",
            ),
            interval = EvaluationInterval.MONTHLY,
            dateWindow = DateWindow.LAST_6_MONTHS,
            trigger = CountTrigger(30),
            organism = Organism.COVID,
        )

        mockMvc.perform(
            post("/subscriptions")
                .content(objectMapper.writeValueAsString(request))
                .contentType(MediaType.APPLICATION_JSON),
        )
            .andExpect(status().isNoContent)

        val result = mockMvc.perform(get("/subscriptions"))
            .andExpect(status().isOk)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andReturn()

        val subscriptions: List<Subscription> = objectMapper.readValue<List<Subscription>>(
            result.response.contentAsString,
        )

        assertTrue(
            subscriptions.any {
                it.name == request.name &&
                    it.interval == request.interval &&
                    it.organism == request.organism &&
                    it.dateWindow == request.dateWindow &&
                    it.filter == request.filter &&
                    it.trigger == request.trigger &&
                    it.active &&
                    !it.conditionsMet
            },
        )
    }
}
