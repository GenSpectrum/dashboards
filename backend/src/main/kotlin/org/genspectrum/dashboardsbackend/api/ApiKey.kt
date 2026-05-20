package org.genspectrum.dashboardsbackend.api

import kotlin.time.Instant

/** Public metadata about a user's API key. The raw key is never returned after creation. */
data class ApiKeyMetadata(
    val createdAt: Instant,
    val lastUsedAt: Instant?,
)

/** Returned once when a key is first generated. The raw key is never stored and cannot be retrieved again. */
data class GeneratedApiKey(
    val key: String,
    val createdAt: Instant,
)

/** Request body for the internal validate endpoint called by the proxy. */
data class ValidateApiKeyRequest(val key: String)

/** Response from the internal validate endpoint — contains the internal user ID for the validated key. */
data class ValidateApiKeyResponse(val userId: Long)
