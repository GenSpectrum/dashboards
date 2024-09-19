package org.genspectrum.dashboardsbackend.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import org.genspectrum.dashboardsbackend.api.Subscription
import org.genspectrum.dashboardsbackend.api.SubscriptionRequest
import org.genspectrum.dashboardsbackend.api.SubscriptionUpdate
import org.genspectrum.dashboardsbackend.model.subscription.SubscriptionModel
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
class SubscriptionsController(
    val subscriptionModel: SubscriptionModel,
) {

    @GetMapping("/subscriptions/{id}", produces = [MediaType.APPLICATION_JSON_VALUE])
    @Operation(
        summary = "Get a subscription",
        description = "Gets a specific subscription of a user by its uuid.",
    )
    fun getSubscription(
        @IdParameter @PathVariable id: String,
        @UserIdParameter @RequestParam userId: String,
    ): Subscription {
        return subscriptionModel.getSubscription(
            subscriptionId = id,
            userId = userId,
        )
    }

    @GetMapping("/subscriptions", produces = [MediaType.APPLICATION_JSON_VALUE])
    @Operation(
        summary = "Get all subscriptions of a user",
        description = "Returns a list of all subscriptions of a user.",
    )
    fun getSubscriptions(@UserIdParameter @RequestParam userId: String): List<Subscription> {
        return subscriptionModel.getSubscriptions(userId)
    }

    @PostMapping("/subscriptions")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
        summary = "Create a new subscription",
        description = "Creates a new subscription for a user.",
    )
    fun postSubscriptions(
        @RequestBody subscription: SubscriptionRequest,
        @UserIdParameter @RequestParam userId: String,
    ): Subscription {
        return subscriptionModel.postSubscriptions(
            request = subscription,
            userId = userId,
        )
    }

    @DeleteMapping("/subscriptions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
        summary = "Delete a subscription",
        description = "Deletes a specific subscription of a user by its uuid.",
    )
    fun deleteSubscription(@IdParameter @PathVariable id: String, @UserIdParameter @RequestParam userId: String) {
        subscriptionModel.deleteSubscription(
            subscriptionId = id,
            userId = userId,
        )
    }

    @PutMapping("/subscriptions/{id}")
    @Operation(
        summary = "Update a subscription",
        description = "Updates a specific subscription of a user by its uuid.",
    )
    fun putSubscription(
        @RequestBody subscription: SubscriptionUpdate,
        @IdParameter @PathVariable id: String,
        @UserIdParameter @RequestParam userId: String,
    ): Subscription {
        return subscriptionModel.putSubscription(
            subscriptionId = id,
            subscriptionUpdate = subscription,
            userId = userId,
        )
    }
}

@Parameter(description = "The (UU)ID of the subscription", example = "123e4567-e89b-12d3-a456-426614174000")
annotation class IdParameter

@Parameter(description = "The ID of the user")
annotation class UserIdParameter
