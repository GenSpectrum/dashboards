package org.genspectrum.dashboardsbackend.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import org.genspectrum.dashboardsbackend.api.Collection
import org.genspectrum.dashboardsbackend.api.CollectionRequest
import org.genspectrum.dashboardsbackend.api.CollectionUpdate
import org.genspectrum.dashboardsbackend.model.collection.CollectionModel
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
class CollectionsController(private val collectionModel: CollectionModel) {
    @GetMapping("/collections", produces = [MediaType.APPLICATION_JSON_VALUE])
    @Operation(
        summary = "Get collections",
        description = "Returns collections filtered by optional userId and/or organism parameters.",
    )
    fun getCollections(
        @RequestParam(required = false) userId: String?,
        @RequestParam(required = false) organism: String?,
    ): List<Collection> = collectionModel.getCollections(
        userId = userId,
        organism = organism,
    )

    @GetMapping("/collections/{id}", produces = [MediaType.APPLICATION_JSON_VALUE])
    @Operation(
        summary = "Get a collection by ID",
        description = "Returns a single collection with all its variants.",
    )
    fun getCollection(
        @Parameter(description = "The ID of the collection", example = "1") @PathVariable id: Long,
    ): Collection = collectionModel.getCollection(id)

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

    @PutMapping("/collections/{id}")
    @Operation(
        summary = "Update a collection",
        description = "Updates a collection. Only the owner can update their collection. " +
            "Provide only the fields you want to update.",
    )
    fun putCollection(
        @RequestBody collection: CollectionUpdate,
        @Parameter(description = "The ID of the collection", example = "1") @PathVariable id: Long,
        @UserIdParameter @RequestParam userId: String,
    ): Collection = collectionModel.putCollection(id, collection, userId)

    @DeleteMapping("/collections/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
        summary = "Delete a collection",
        description = "Deletes a collection. Only the owner can delete their collection.",
    )
    fun deleteCollection(
        @Parameter(description = "The ID of the collection", example = "1") @PathVariable id: Long,
        @UserIdParameter @RequestParam userId: String,
    ) = collectionModel.deleteCollection(id, userId)
}
