package org.genspectrum.dashboardsbackend.controller

import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.hasLength
import org.hamcrest.Matchers.notNullValue
import org.hamcrest.Matchers.nullValue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@SpringBootTest
@AutoConfigureMockMvc
@Import(ApiKeyClient::class, UsersClient::class)
class ApiKeyControllerTest(
    @param:Autowired private val apiKeyClient: ApiKeyClient,
    @param:Autowired private val usersClient: UsersClient,
) {
    // --- GET /api-keys ---

    @Test
    fun `GIVEN no key exists WHEN getting API key THEN returns 404`() {
        val userId = usersClient.createUser()

        apiKeyClient.getApiKeyRaw(userId)
            .andExpect(status().isNotFound)
    }

    @Test
    fun `GIVEN key exists WHEN getting API key THEN returns metadata with null lastUsedAt`() {
        val userId = usersClient.createUser()
        apiKeyClient.generateApiKey(userId)

        val metadata = apiKeyClient.getApiKey(userId)

        assertThat(metadata.createdAt, notNullValue())
        assertThat(metadata.lastUsedAt, nullValue())
    }

    @Test
    fun `GIVEN key has been used WHEN getting API key THEN returns non-null lastUsedAt`() {
        val userId = usersClient.createUser()
        val generated = apiKeyClient.generateApiKey(userId)
        apiKeyClient.validateApiKey(generated.key)

        val metadata = apiKeyClient.getApiKey(userId)

        assertThat(metadata.lastUsedAt, notNullValue())
    }

    // --- POST /api-keys ---

    @Test
    fun `GIVEN no key exists WHEN generating a key THEN returns a 64-char hex key`() {
        val userId = usersClient.createUser()

        val generated = apiKeyClient.generateApiKey(userId)

        assertThat(generated.key, hasLength(64))
        assertThat(generated.key.matches(Regex("[0-9a-f]+")), equalTo(true))
        assertThat(generated.createdAt, notNullValue())
    }

    @Test
    fun `GIVEN a key already exists WHEN generating a second key THEN returns 409`() {
        val userId = usersClient.createUser()
        apiKeyClient.generateApiKey(userId)

        apiKeyClient.generateApiKeyRaw(userId)
            .andExpect(status().isConflict)
            .andExpect(jsonPath("$.detail").value("An API key already exists for user $userId"))
    }

    @Test
    fun `GIVEN a nonexistent user WHEN generating a key THEN returns 404`() {
        apiKeyClient.generateApiKeyRaw(999999999L)
            .andExpect(status().isNotFound)
    }

    @Test
    fun `GIVEN two different users WHEN each generates a key THEN both succeed independently`() {
        val userId1 = usersClient.createUser()
        val userId2 = usersClient.createUser()

        val key1 = apiKeyClient.generateApiKey(userId1)
        val key2 = apiKeyClient.generateApiKey(userId2)

        assertThat(key1.key == key2.key, equalTo(false))
    }

    // --- DELETE /api-keys ---

    @Test
    fun `GIVEN a key exists WHEN revoking it THEN returns 204 and GET returns 404 afterwards`() {
        val userId = usersClient.createUser()
        apiKeyClient.generateApiKey(userId)

        apiKeyClient.revokeApiKey(userId)

        apiKeyClient.getApiKeyRaw(userId).andExpect(status().isNotFound)
    }

    @Test
    fun `GIVEN no key exists WHEN revoking THEN returns 404`() {
        val userId = usersClient.createUser()

        apiKeyClient.revokeApiKeyRaw(userId)
            .andExpect(status().isNotFound)
    }

    @Test
    fun `GIVEN a key is revoked WHEN generating a new key THEN returns 201`() {
        val userId = usersClient.createUser()
        apiKeyClient.generateApiKey(userId)
        apiKeyClient.revokeApiKey(userId)

        apiKeyClient.generateApiKeyRaw(userId)
            .andExpect(status().isCreated)
    }

    // --- POST /internal/api-keys/validate ---

    @Test
    fun `GIVEN a valid key WHEN validating THEN returns the correct userId`() {
        val userId = usersClient.createUser()
        val generated = apiKeyClient.generateApiKey(userId)

        val response = apiKeyClient.validateApiKey(generated.key)

        assertThat(response.userId, equalTo(userId))
    }

    @Test
    fun `GIVEN an unknown key WHEN validating THEN returns 404`() {
        apiKeyClient.validateApiKeyRaw("a".repeat(64))
            .andExpect(status().isNotFound)
    }

    @Test
    fun `GIVEN a revoked key WHEN validating THEN returns 404`() {
        val userId = usersClient.createUser()
        val generated = apiKeyClient.generateApiKey(userId)
        apiKeyClient.revokeApiKey(userId)

        apiKeyClient.validateApiKeyRaw(generated.key)
            .andExpect(status().isNotFound)
    }

    @Test
    fun `GIVEN a valid key WHEN validating multiple times THEN lastUsedAt is updated each time`() {
        val userId = usersClient.createUser()
        val generated = apiKeyClient.generateApiKey(userId)

        apiKeyClient.validateApiKey(generated.key)
        val firstUsed = apiKeyClient.getApiKey(userId).lastUsedAt

        Thread.sleep(10)

        apiKeyClient.validateApiKey(generated.key)
        val secondUsed = apiKeyClient.getApiKey(userId).lastUsedAt

        assertThat(secondUsed!! > firstUsed!!, equalTo(true))
    }
}
