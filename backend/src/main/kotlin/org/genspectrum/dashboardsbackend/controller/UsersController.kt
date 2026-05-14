package org.genspectrum.dashboardsbackend.controller

import io.swagger.v3.oas.annotations.Operation
import org.genspectrum.dashboardsbackend.api.PublicUser
import org.genspectrum.dashboardsbackend.api.User
import org.genspectrum.dashboardsbackend.api.UserSyncRequest
import org.genspectrum.dashboardsbackend.model.user.UserModel
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController

@RestController
class UsersController(private val userModel: UserModel) {
    @PostMapping("/users/sync", produces = [MediaType.APPLICATION_JSON_VALUE])
    @Operation(
        summary = "Sync user from external auth provider",
        description = "Upserts a user record by github_id. Returns the user with their internal ID.",
    )
    fun syncUser(@RequestBody request: UserSyncRequest): User = userModel.syncUser(request)

    @GetMapping("/users/{id}", produces = [MediaType.APPLICATION_JSON_VALUE])
    @Operation(
        summary = "Get user by internal ID",
        description = "Returns public user info by internal UUID.",
    )
    fun getUser(@PathVariable id: Long): PublicUser = userModel.getUser(id)
}
