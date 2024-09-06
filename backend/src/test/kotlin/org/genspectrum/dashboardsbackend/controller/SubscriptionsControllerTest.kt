package org.genspectrum.dashboardsbackend.controller

import org.genspectrum.dashboardsbackend.subscriptions.CountTrigger
import org.genspectrum.dashboardsbackend.subscriptions.DateWindow
import org.genspectrum.dashboardsbackend.subscriptions.EvaluationInterval
import org.genspectrum.dashboardsbackend.subscriptions.Organism
import org.genspectrum.dashboardsbackend.subscriptions.Subscription
import org.genspectrum.dashboardsbackend.subscriptions.SubscriptionRequest
import org.genspectrum.dashboardsbackend.subscriptions.SubscriptionUpdate
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.hasItem
import org.hamcrest.Matchers.hasProperty
import org.hamcrest.Matchers.not
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.content
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.UUID

val dummySubscriptionRequest = SubscriptionRequest(
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

@SpringBootTest
@AutoConfigureMockMvc
@Import(SubscriptionsClient::class)
class SubscriptionsControllerTest(
    @Autowired val subscriptionsClient: SubscriptionsClient,
) {
    @Test
    fun `GIVEN I created a subscription WHEN getting subscriptions THEN contains created subscription`() {
        val userId = getNewUserId()
        val createdSubscription = subscriptionsClient.postSubscription(dummySubscriptionRequest, userId)

        val subscriptions = subscriptionsClient.getSubscriptions(userId)

        assertThat(subscriptions, hasItem(createdSubscription))
    }

    @Test
    fun `GIVEN subscriptions for multiple users WHEN getting subscriptions THEN contains subscriptions of user`() {
        val otherUserId = getNewUserId()
        val otherCreatedSubscription = subscriptionsClient.postSubscription(dummySubscriptionRequest, otherUserId)

        val userId = getNewUserId()
        val createdSubscription = subscriptionsClient.postSubscription(dummySubscriptionRequest, userId)

        val subscriptions = subscriptionsClient.getSubscriptions(userId)

        assertThat(subscriptions, hasItem(createdSubscription))
        assertThat(subscriptions, not(hasItem(otherCreatedSubscription)))
    }

    @Test
    fun `WHEN getting subscriptions with invalid UUID THEN returns 400`() {
        val userId = getNewUserId()
        subscriptionsClient.getSubscriptionRaw("this-is-not-a-uuid", userId)
            .andExpect(status().isBadRequest)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("\$.detail").value("Invalid UUID this-is-not-a-uuid"))
    }

    @Test
    fun `WHEN getting subscriptions that does not exist THEN returns 404`() {
        val userId = getNewUserId()
        subscriptionsClient.getSubscriptionRaw("00000000-0000-0000-0000-000000000000", userId)
            .andExpect(status().isNotFound)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("\$.detail").value("Subscription 00000000-0000-0000-0000-000000000000 not found"))
    }

    @Test
    fun `GIVEN subscription exists WHEN getting subscription THEN returns its data`() {
        val userId = getNewUserId()
        val createdSubscription = subscriptionsClient.postSubscription(dummySubscriptionRequest, userId)

        val subscription = subscriptionsClient.getSubscription(createdSubscription.id, userId)

        assertThat(subscription, equalTo(createdSubscription))
    }

    @Test
    fun `GIVEN subscription exists for another user WHEN getting subscription THEN returns 404`() {
        val otherUserId = getNewUserId()
        val createdSubscription = subscriptionsClient.postSubscription(dummySubscriptionRequest, otherUserId)

        val userId = getNewUserId()
        subscriptionsClient.getSubscriptionRaw(createdSubscription.id, userId)
            .andExpect(status().isNotFound)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("\$.detail").value("Subscription ${createdSubscription.id} not found"))
    }

    @Test
    fun `WHEN I delete a subscription that does not exist THEN returns 404`() {
        val userId = getNewUserId()
        subscriptionsClient.deleteSubscriptionRaw("00000000-0000-0000-0000-000000000000", userId)
            .andExpect(status().isNotFound)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("\$.detail").value("Subscription 00000000-0000-0000-0000-000000000000 not found"))
    }

    @Test
    fun `WHEN I delete a subscription that exist for other user THEN returns 404`() {
        val otherUserId = getNewUserId()
        val createdSubscription = subscriptionsClient.postSubscription(dummySubscriptionRequest, otherUserId)

        val userId = getNewUserId()
        subscriptionsClient.deleteSubscriptionRaw(createdSubscription.id, userId)
            .andExpect(status().isNotFound)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("\$.detail").value("Subscription ${createdSubscription.id} not found"))
    }

    @Test
    fun `WHEN I delete a subscription with invalid UUID THEN return 400`() {
        val userId = getNewUserId()
        subscriptionsClient.deleteSubscriptionRaw("this-is-not-a-uuid", userId)
            .andExpect(status().isBadRequest)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("\$.detail").value("Invalid UUID this-is-not-a-uuid"))
    }

    @Test
    fun `GIVEN subscription exists WHEN I delete it THEN it does not exist anymore`() {
        val userId = getNewUserId()
        val createdSubscription = subscriptionsClient.postSubscription(dummySubscriptionRequest, userId)

        subscriptionsClient.deleteSubscriptionRaw(createdSubscription.id, userId)
            .andExpect(status().isNoContent)

        subscriptionsClient.getSubscriptionRaw(createdSubscription.id, userId)
            .andExpect(status().isNotFound)

        assertThat(
            subscriptionsClient.getSubscriptions(userId),
            not(hasItem(hasProperty<Subscription>("id", equalTo(createdSubscription.id)))),
        )
    }

    @Test
    fun `GIVEN subscription exists WHEN I edit all fields THEN it is updated`() {
        val userId = getNewUserId()
        val createdSubscription = subscriptionsClient.postSubscription(dummySubscriptionRequest, userId)

        val updatedSubscriptionRequest = SubscriptionUpdate(
            name = "Updated name",
            filter = mapOf(
                "country" to "Germany",
                "dateFrom" to "2024-01-01",
                "dateTo" to "2024-01-05",
            ),
            interval = EvaluationInterval.WEEKLY,
            dateWindow = DateWindow.LAST_6_MONTHS,
            trigger = CountTrigger(10),
            organism = Organism.RSV_A,
        )

        val updatedSubscription =
            subscriptionsClient.putSubscription(
                updatedSubscriptionRequest,
                createdSubscription.id,
                userId,
            )

        val subscription = subscriptionsClient.getSubscription(createdSubscription.id, userId)

        assertThat(subscription, equalTo(updatedSubscription))
        assertThat(subscription.name, equalTo(updatedSubscriptionRequest.name))
    }

    @Test
    fun `GIVEN subscription exists WHEN I edit one entry THEN it is updated`() {
        val userId = getNewUserId()
        val createdSubscription = subscriptionsClient.postSubscription(dummySubscriptionRequest, userId)

        val updatedSubscriptionRequest = SubscriptionUpdate(
            name = "Updated name",
        )

        val updatedSubscription =
            subscriptionsClient.putSubscription(
                updatedSubscriptionRequest,
                createdSubscription.id,
                userId,
            )

        val subscription = subscriptionsClient.getSubscription(createdSubscription.id, userId)

        assertThat(subscription, equalTo(updatedSubscription))
        assertThat(subscription.name, equalTo(updatedSubscriptionRequest.name))
    }

    @Test
    fun `GIVEN a subscription from another user WHEN I edit it THEN returns 404`() {
        val otherUserId = getNewUserId()
        val createdSubscription = subscriptionsClient.postSubscription(dummySubscriptionRequest, otherUserId)

        val userId = getNewUserId()
        subscriptionsClient.putSubscriptionRaw(SubscriptionUpdate(), createdSubscription.id, userId)
            .andExpect(status().isNotFound)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("\$.detail").value("Subscription ${createdSubscription.id} not found"))
    }

    @Test
    fun `GIVEN a subscription with invalid UUID WHEN I edit it THEN returns 400`() {
        val userId = getNewUserId()
        subscriptionsClient.putSubscriptionRaw(SubscriptionUpdate(), "this-is-not-a-uuid", userId)
            .andExpect(status().isBadRequest)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("\$.detail").value("Invalid UUID this-is-not-a-uuid"))
    }

    @Test
    fun `GIVEN no subscription WHEN I edit it THEN returns 404`() {
        val userId = getNewUserId()
        subscriptionsClient.putSubscriptionRaw(SubscriptionUpdate(), "00000000-0000-0000-0000-000000000000", userId)
            .andExpect(status().isNotFound)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("\$.detail").value("Subscription 00000000-0000-0000-0000-000000000000 not found"))
    }

    private fun getNewUserId(): String {
        return UUID.randomUUID().toString()
    }
}
