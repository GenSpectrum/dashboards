package org.genspectrum.dashboardsbackend.controller

import org.genspectrum.dashboardsbackend.subscriptions.CountTrigger
import org.genspectrum.dashboardsbackend.subscriptions.DateWindow
import org.genspectrum.dashboardsbackend.subscriptions.EvaluationInterval
import org.genspectrum.dashboardsbackend.subscriptions.Organism
import org.genspectrum.dashboardsbackend.subscriptions.Subscription
import org.genspectrum.dashboardsbackend.subscriptions.SubscriptionRequest
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
        val createdSubscription = subscriptionsClient.postSubscription(dummySubscriptionRequest)

        val subscriptions = subscriptionsClient.getSubscriptions()

        assertThat(subscriptions, hasItem(createdSubscription))
    }

    @Test
    fun `WHEN getting subscriptions with invalid UUID THEN returns 400`() {
        subscriptionsClient.getSubscriptionRaw("this-is-not-a-uuid")
            .andExpect(status().isBadRequest)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("\$.detail").value("Invalid UUID this-is-not-a-uuid"))
    }

    @Test
    fun `WHEN getting subscriptions that does not exist THEN returns 404`() {
        subscriptionsClient.getSubscriptionRaw("00000000-0000-0000-0000-000000000000")
            .andExpect(status().isNotFound)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("\$.detail").value("Subscription 00000000-0000-0000-0000-000000000000 not found"))
    }

    @Test
    fun `GIVEN subscription exists WHEN getting subscription THEN returns its data`() {
        val createdSubscription = subscriptionsClient.postSubscription(dummySubscriptionRequest)

        val subscription = subscriptionsClient.getSubscription(createdSubscription.id)

        assertThat(subscription, equalTo(createdSubscription))
    }

    @Test
    fun `WHEN I delete a subscription that does not exist THEN returns 404`() {
        subscriptionsClient.deleteSubscriptionRaw("00000000-0000-0000-0000-000000000000")
            .andExpect(status().isNotFound)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("\$.detail").value("Subscription 00000000-0000-0000-0000-000000000000 not found"))
    }

    @Test
    fun `WHEN I delete a subscription with invalid UUID THEN return 400`() {
        subscriptionsClient.deleteSubscriptionRaw("this-is-not-a-uuid")
            .andExpect(status().isBadRequest)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("\$.detail").value("Invalid UUID this-is-not-a-uuid"))
    }

    @Test
    fun `GIVEN subscription exists WHEN I delete it THEN it does not exist anymore`() {
        val createdSubscription = subscriptionsClient.postSubscription(dummySubscriptionRequest)

        subscriptionsClient.deleteSubscriptionRaw(createdSubscription.id)
            .andExpect(status().isNoContent)

        subscriptionsClient.getSubscriptionRaw(createdSubscription.id)
            .andExpect(status().isNotFound)

        assertThat(
            subscriptionsClient.getSubscriptions(),
            not(hasItem(hasProperty<Subscription>("id", equalTo(createdSubscription.id)))),
        )
    }
}
