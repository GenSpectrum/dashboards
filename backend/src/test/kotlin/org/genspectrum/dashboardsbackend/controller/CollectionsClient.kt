package org.genspectrum.dashboardsbackend.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.genspectrum.dashboardsbackend.api.Collection
import org.genspectrum.dashboardsbackend.api.CollectionRequest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.ResultActions
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.content
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

class CollectionsClient(private val mockMvc: MockMvc, private val objectMapper: ObjectMapper) {
    fun postCollectionRaw(collection: CollectionRequest, userId: String): ResultActions = mockMvc.perform(
        post("/collections?userId=$userId")
            .content(objectMapper.writeValueAsString(collection))
            .contentType(MediaType.APPLICATION_JSON),
    )

    fun postCollection(collection: CollectionRequest, userId: String): Collection = deserializeJsonResponse(
        postCollectionRaw(collection, userId)
            .andExpect(status().isCreated),
    )

    fun getCollectionsRaw(userId: String? = null, organism: String? = null): ResultActions {
        val params = buildString {
            val queryParams = mutableListOf<String>()
            if (userId != null) queryParams.add("userId=$userId")
            if (organism != null) queryParams.add("organism=$organism")
            if (queryParams.isNotEmpty()) {
                append("?")
                append(queryParams.joinToString("&"))
            }
        }
        return mockMvc.perform(get("/collections$params"))
    }

    fun getCollections(userId: String? = null, organism: String? = null): List<Collection> = deserializeJsonResponse(
        getCollectionsRaw(userId, organism)
            .andExpect(status().isOk),
    )

    fun getCollectionRaw(id: String): ResultActions = mockMvc.perform(get("/collections/$id"))

    fun getCollection(id: String): Collection = deserializeJsonResponse(
        getCollectionRaw(id)
            .andExpect(status().isOk),
    )

    fun deleteCollectionRaw(id: String, userId: String): ResultActions =
        mockMvc.perform(delete("/collections/$id?userId=$userId"))

    fun deleteCollection(id: String, userId: String) {
        deleteCollectionRaw(id, userId).andExpect(status().isNoContent)
    }

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
