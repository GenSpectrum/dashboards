package org.genspectrum.dashboardsbackend.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.genspectrum.dashboardsbackend.api.Subscription
import org.genspectrum.dashboardsbackend.api.SubscriptionRequest
import org.genspectrum.dashboardsbackend.api.SubscriptionUpdate
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.ResultActions
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.content
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

class SubscriptionsClient(private val mockMvc: MockMvc, private val objectMapper: ObjectMapper) {
    fun getSubscriptionRaw(id: String, userId: Long) = mockMvc.perform(get("/subscriptions/$id?userId=$userId"))

    fun getSubscription(id: String, userId: Long): Subscription = deserializeJsonResponse(
        getSubscriptionRaw(id, userId)
            .andExpect(status().isOk),
    )

    fun getSubscriptionsRaw(userId: Long) = mockMvc.perform(get("/subscriptions?userId=$userId"))

    fun getSubscriptions(userId: Long): List<Subscription> = deserializeJsonResponse(
        getSubscriptionsRaw(userId)
            .andExpect(status().isOk),
    )

    fun postSubscriptionRaw(subscription: SubscriptionRequest, userId: Long) = mockMvc.perform(
        post("/subscriptions?userId=$userId")
            .content(objectMapper.writeValueAsString(subscription))
            .contentType(MediaType.APPLICATION_JSON),
    )

    fun postSubscription(subscription: SubscriptionRequest, userId: Long): Subscription = deserializeJsonResponse(
        postSubscriptionRaw(subscription, userId)
            .andExpect(status().isCreated),
    )

    fun deleteSubscriptionRaw(id: String, userId: Long) = mockMvc.perform(delete("/subscriptions/$id?userId=$userId"))

    fun deleteSubscription(id: String, userId: Long) = deleteSubscriptionRaw(
        id,
        userId,
    ).andExpect(status().isNoContent)

    fun putSubscriptionRaw(subscription: SubscriptionUpdate, id: String, userId: Long) = mockMvc.perform(
        put("/subscriptions/$id?userId=$userId")
            .content(objectMapper.writeValueAsString(subscription))
            .contentType(MediaType.APPLICATION_JSON),
    )

    fun putSubscription(subscription: SubscriptionUpdate, id: String, userId: Long): Subscription =
        deserializeJsonResponse(
            putSubscriptionRaw(subscription, id, userId)
                .andExpect(status().isOk),
        )

    fun evaluateTriggerRaw(userId: Long, subscriptionId: String) = mockMvc.perform(
        get("/subscriptions/evaluateTrigger")
            .queryParam("userId", userId.toString())
            .queryParam("id", subscriptionId),
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
