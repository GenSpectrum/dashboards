package org.genspectrum.dashboardsbackend.controller

import org.genspectrum.dashboardsbackend.model.SubscriptionModel
import org.genspectrum.dashboardsbackend.subscriptions.Subscription
import org.genspectrum.dashboardsbackend.subscriptions.SubscriptionRequest
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
class SubscriptionsController(
    val subscriptionModel: SubscriptionModel,
) {

    @GetMapping("/subscriptions", produces = [MediaType.APPLICATION_JSON_VALUE])
    fun getSubscriptions(): List<Subscription> {
        return subscriptionModel.getSubscriptions()
    }

    @PostMapping("/subscriptions")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun postSubscriptions(@RequestBody subscription: SubscriptionRequest) {
        subscriptionModel.postSubscriptions(subscription)
    }
}
