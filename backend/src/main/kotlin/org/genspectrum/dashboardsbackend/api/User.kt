package org.genspectrum.dashboardsbackend.api

import kotlin.time.Instant

data class User(
    val id: Long,
    val githubId: String?,
    val name: String,
    val email: String?,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class UserSyncRequest(val githubId: String, val name: String, val email: String?)
