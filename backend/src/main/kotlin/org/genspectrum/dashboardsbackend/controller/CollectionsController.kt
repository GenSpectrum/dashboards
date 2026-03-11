package org.genspectrum.dashboardsbackend.controller

import io.swagger.v3.oas.annotations.Operation
import org.genspectrum.dashboardsbackend.api.Collection
import org.genspectrum.dashboardsbackend.api.CollectionRequest
import org.genspectrum.dashboardsbackend.model.collection.CollectionModel
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
class CollectionsController(private val collectionModel: CollectionModel) {
    @PostMapping("/collections")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
        summary = "Create a new collection",
        description = "Creates a new collection with variants for a user.",
    )
    fun postCollection(
        @RequestBody collection: CollectionRequest,
        @UserIdParameter @RequestParam userId: String,
    ): Collection = collectionModel.createCollection(
        request = collection,
        userId = userId,
    )
}
