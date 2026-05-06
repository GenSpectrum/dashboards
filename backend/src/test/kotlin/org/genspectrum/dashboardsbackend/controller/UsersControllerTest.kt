package org.genspectrum.dashboardsbackend.controller

import org.genspectrum.dashboardsbackend.api.UserSyncRequest
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.notNullValue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@Import(UsersClient::class)
class UsersControllerTest(@param:Autowired private val usersClient: UsersClient) {

    @Test
    fun `WHEN syncing a new user THEN creates user and returns it with internal ID`() {
        val githubId = UUID.randomUUID().toString()
        val request = UserSyncRequest(githubId = githubId, name = "Alice", email = "alice@example.com")

        val user = usersClient.syncUser(request)

        assertThat(user.id, notNullValue())
        assertThat(user.githubId, equalTo(githubId))
        assertThat(user.name, equalTo("Alice"))
        assertThat(user.email, equalTo("alice@example.com"))
    }

    @Test
    fun `WHEN syncing the same github ID twice THEN returns same internal ID`() {
        val githubId = UUID.randomUUID().toString()
        val request = UserSyncRequest(githubId = githubId, name = "Bob", email = null)

        val first = usersClient.syncUser(request)
        val second = usersClient.syncUser(request)

        assertThat(first.id, equalTo(second.id))
    }

    @Test
    fun `WHEN syncing with updated name THEN name is updated`() {
        val githubId = UUID.randomUUID().toString()
        usersClient.syncUser(UserSyncRequest(githubId = githubId, name = "Old Name", email = null))

        val updated = usersClient.syncUser(UserSyncRequest(githubId = githubId, name = "New Name", email = null))

        assertThat(updated.name, equalTo("New Name"))
    }

    @Test
    fun `WHEN syncing without email THEN email is null`() {
        val githubId = UUID.randomUUID().toString()
        val user = usersClient.syncUser(UserSyncRequest(githubId = githubId, name = "Charlie", email = null))

        assertThat(user.email, nullValue())
    }

    @Test
    fun `WHEN getting user by ID THEN returns public user info`() {
        val created = usersClient.syncUser(UserSyncRequest(githubId = UUID.randomUUID().toString(), name = "Dave", email = null))

        val fetched = usersClient.getUser(created.id)

        assertThat(fetched.id, equalTo(created.id))
        assertThat(fetched.name, equalTo("Dave"))
    }

    @Test
    fun `WHEN getting user with nonexistent ID THEN returns 404`() {
        usersClient.getUserRaw(999999999L)
            .andExpect(status().isNotFound)
            .andExpect(jsonPath("$.detail").value("User 999999999 not found"))
    }

    @Test
    fun `WHEN syncing two different github IDs THEN they get different internal IDs`() {
        val first = usersClient.syncUser(
            UserSyncRequest(githubId = UUID.randomUUID().toString(), name = "User1", email = null),
        )
        val second = usersClient.syncUser(
            UserSyncRequest(githubId = UUID.randomUUID().toString(), name = "User2", email = null),
        )

        assertThat(first.id == second.id, equalTo(false))
    }
}
