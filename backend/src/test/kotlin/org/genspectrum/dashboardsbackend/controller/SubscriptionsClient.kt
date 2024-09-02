package org.genspectrum.dashboardsbackend.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.genspectrum.dashboardsbackend.subscriptions.Subscription
import org.genspectrum.dashboardsbackend.subscriptions.SubscriptionRequest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.ResultActions
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.content
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

class SubscriptionsClient(
    val mockMvc: MockMvc,
    val objectMapper: ObjectMapper,
) {
    fun getSubscriptionRaw(id: String) = mockMvc.perform(get("/subscriptions/$id"))

    fun getSubscription(id: String): Subscription = deserializeJsonResponse(
        getSubscriptionRaw(id)
            .andExpect(status().isOk),
    )

    fun getSubscriptionsRaw() = mockMvc.perform(get("/subscriptions"))

    fun getSubscriptions(): List<Subscription> = deserializeJsonResponse(
        getSubscriptionsRaw()
            .andExpect(status().isOk),
    )

    fun postSubscriptionRaw(subscription: SubscriptionRequest) = mockMvc.perform(
        post("/subscriptions")
            .content(objectMapper.writeValueAsString(subscription))
            .contentType(MediaType.APPLICATION_JSON),
    )

    fun postSubscription(subscription: SubscriptionRequest): Subscription = deserializeJsonResponse(
        postSubscriptionRaw(subscription)
            .andExpect(status().isCreated),
    )

    private inline fun <reified T> deserializeJsonResponse(resultActions: ResultActions): T {
        val content =
            resultActions
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andReturn()
                .response
                .contentAsString
        return objectMapper.readValue(content)
    }
}
