package org.genspectrum.dashboardsbackend.controller

import io.swagger.v3.oas.annotations.Operation
import org.genspectrum.dashboardsbackend.api.ApiKeyMetadata
import org.genspectrum.dashboardsbackend.api.GeneratedApiKey
import org.genspectrum.dashboardsbackend.api.ValidateApiKeyRequest
import org.genspectrum.dashboardsbackend.api.ValidateApiKeyResponse
import org.genspectrum.dashboardsbackend.model.api_key.ApiKeyModel
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
class ApiKeyController(private val apiKeyModel: ApiKeyModel) {
    @GetMapping("/api-keys", produces = [MediaType.APPLICATION_JSON_VALUE])
    @Operation(
        summary = "Get API key metadata",
        description = "Returns metadata for the user's current API key. Returns 404 if no key exists.",
    )
    fun getApiKey(@RequestParam userId: Long): ApiKeyMetadata = apiKeyModel.getApiKey(userId)

    @PostMapping("/api-keys", produces = [MediaType.APPLICATION_JSON_VALUE])
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
        summary = "Generate a new API key",
        description = "Generates a new API key for the user. Returns the raw key once — it is never stored. Returns 409 if a key already exists.",
    )
    fun generateApiKey(@RequestParam userId: Long): GeneratedApiKey = apiKeyModel.generateApiKey(userId)

    @DeleteMapping("/api-keys")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
        summary = "Revoke API key",
        description = "Deletes the user's current API key. Returns 404 if no key exists.",
    )
    fun revokeApiKey(@RequestParam userId: Long) = apiKeyModel.revokeApiKey(userId)

    @PostMapping("/internal/api-keys/validate", produces = [MediaType.APPLICATION_JSON_VALUE])
    @Operation(
        summary = "Validate an API key",
        description = """Takes a raw API key and returns the associated userId on success (200).
Returns 404 if the key does not match any stored hash — the proxy treats this as an invalid
credential and falls through to the session cookie check. Only reachable within the internal
Docker network, so no additional access control is applied.""",
    )
    fun validateApiKey(@RequestBody request: ValidateApiKeyRequest): ValidateApiKeyResponse {
        val userId = apiKeyModel.validateApiKey(request.key)
        return ValidateApiKeyResponse(userId = userId)
    }
}
