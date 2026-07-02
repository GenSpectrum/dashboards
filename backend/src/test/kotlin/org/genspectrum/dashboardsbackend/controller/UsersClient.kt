package org.genspectrum.dashboardsbackend.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.genspectrum.dashboardsbackend.api.PublicUser
import org.genspectrum.dashboardsbackend.api.User
import org.genspectrum.dashboardsbackend.api.UserSyncRequest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.ResultActions
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.content
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.UUID

class UsersClient(private val mockMvc: MockMvc, private val objectMapper: ObjectMapper) {
    fun syncUserRaw(request: UserSyncRequest): ResultActions = mockMvc.perform(
        post("/users/sync")
            .content(objectMapper.writeValueAsString(request))
            .contentType(MediaType.APPLICATION_JSON),
    )

    fun syncUser(request: UserSyncRequest): User = deserializeJsonResponse(
        syncUserRaw(request).andExpect(status().isOk),
    )

    fun getUserRaw(id: Long): ResultActions = mockMvc.perform(get("/users/$id"))

    fun getUser(id: Long): PublicUser = deserializeJsonResponse(
        getUserRaw(id).andExpect(status().isOk),
    )

    /** Creates a user with a random GitHub ID and returns the internal Long user ID. */
    fun createUser(): Long = syncUser(
        UserSyncRequest(
            githubId = UUID.randomUUID().toString(),
            name = "Test User",
            email = null,
        ),
    ).id

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
