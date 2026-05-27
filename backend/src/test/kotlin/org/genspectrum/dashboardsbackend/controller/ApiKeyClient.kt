package org.genspectrum.dashboardsbackend.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.genspectrum.dashboardsbackend.api.ApiKeyMetadata
import org.genspectrum.dashboardsbackend.api.GeneratedApiKey
import org.genspectrum.dashboardsbackend.api.ValidateApiKeyRequest
import org.genspectrum.dashboardsbackend.api.ValidateApiKeyResponse
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.ResultActions
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.content
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

class ApiKeyClient(private val mockMvc: MockMvc, private val objectMapper: ObjectMapper) {
    fun getApiKeyRaw(userId: Long): ResultActions = mockMvc.perform(get("/api-keys?userId=$userId"))

    fun getApiKey(userId: Long): ApiKeyMetadata = deserializeJsonResponse(
        getApiKeyRaw(userId).andExpect(status().isOk),
    )

    fun generateApiKeyRaw(userId: Long): ResultActions = mockMvc.perform(post("/api-keys?userId=$userId"))

    fun generateApiKey(userId: Long): GeneratedApiKey = deserializeJsonResponse(
        generateApiKeyRaw(userId).andExpect(status().isCreated),
    )

    fun revokeApiKeyRaw(userId: Long): ResultActions = mockMvc.perform(delete("/api-keys?userId=$userId"))

    fun revokeApiKey(userId: Long) {
        revokeApiKeyRaw(userId).andExpect(status().isNoContent)
    }

    fun validateApiKeyRaw(key: String): ResultActions = mockMvc.perform(
        post("/internal/api-keys/validate")
            .content(objectMapper.writeValueAsString(ValidateApiKeyRequest(key)))
            .contentType(MediaType.APPLICATION_JSON),
    )

    fun validateApiKey(key: String): ValidateApiKeyResponse = deserializeJsonResponse(
        validateApiKeyRaw(key).andExpect(status().isOk),
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
