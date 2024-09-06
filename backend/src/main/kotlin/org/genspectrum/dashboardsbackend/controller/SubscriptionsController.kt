package org.genspectrum.dashboardsbackend.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import org.genspectrum.dashboardsbackend.model.SubscriptionModel
import org.genspectrum.dashboardsbackend.subscriptions.Subscription
import org.genspectrum.dashboardsbackend.subscriptions.SubscriptionRequest
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
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
        @Parameter(description = SUBSCRIPTION_ID_DESCRIPTION, example = SUBSCRIPTION_ID_EXAMPLE)
        @PathVariable id: String,
        @Parameter(description = USER_ID_DESCRIPTION)
        @RequestParam userId: String,
    ): Subscription {
        return subscriptionModel.getSubscription(id, userId)
    }

    @GetMapping("/subscriptions", produces = [MediaType.APPLICATION_JSON_VALUE])
    @Operation(
        summary = "Get all subscriptions of a user",
        description = "Returns a list of all subscriptions of a user.",
    )
    fun getSubscriptions(
        @Parameter(description = USER_ID_DESCRIPTION) @RequestParam userId: String,
    ): List<Subscription> {
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
        @Parameter(description = USER_ID_DESCRIPTION) @RequestParam userId: String,
    ): Subscription {
        return subscriptionModel.postSubscriptions(subscription, userId)
    }

    @DeleteMapping("/subscriptions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
        summary = "Delete a subscription",
        description = "Deletes a specific subscription of a user by its uuid.",
    )
    fun deleteSubscription(
        @Parameter(description = SUBSCRIPTION_ID_DESCRIPTION, example = SUBSCRIPTION_ID_EXAMPLE)
        @PathVariable id: String,
        @Parameter(description = USER_ID_DESCRIPTION) @RequestParam userId: String,
    ) {
        subscriptionModel.deleteSubscription(id, userId)
    }
}

const val USER_ID_DESCRIPTION = "The ID of the user"

const val SUBSCRIPTION_ID_DESCRIPTION = "The (UU)ID of the subscription"
const val SUBSCRIPTION_ID_EXAMPLE = "123e4567-e89b-12d3-a456-426614174000"
