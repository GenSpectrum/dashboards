package org.genspectrum.dashboardsbackend.controller

import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.content
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@SpringBootTest
@AutoConfigureMockMvc
class SubscriptionsControllerTest(
    @Autowired val mockMvc: MockMvc,
    @Autowired var objectMapper: ObjectMapper,
) {
    @Test
    fun `GET subscriptions returns a list of subscriptions`() {
        mockMvc.perform(get("/subscriptions"))
            .andExpect(status().isOk)
            .andExpect(content().json(objectMapper.writeValueAsString(DUMMY_SUBSCRIPTIONS)))
    }
}
