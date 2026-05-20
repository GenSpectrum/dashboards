package org.genspectrum.dashboardsbackend.config

import org.genspectrum.dashboardsbackend.controller.ApiKeyClient
import org.genspectrum.dashboardsbackend.controller.UsersClient
import org.genspectrum.dashboardsbackend.model.apikey.ApiKeyModel
import org.genspectrum.dashboardsbackend.model.user.UserModel
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.notNullValue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.DefaultApplicationArguments
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@SpringBootTest
@AutoConfigureMockMvc
@Import(ApiKeyClient::class, UsersClient::class)
class SystemUserInitializerTest(
    @param:Autowired private val userModel: UserModel,
    @param:Autowired private val apiKeyModel: ApiKeyModel,
    @param:Autowired private val apiKeyClient: ApiKeyClient,
    @param:Autowired private val usersClient: UsersClient,
) {
    private val noArgs: ApplicationArguments = DefaultApplicationArguments()

    private fun initializerWith(config: SystemUserConfig?) = SystemUserInitializer(
        dashboardsConfig = DashboardsConfig(organisms = emptyMap(), systemUser = config),
        userModel = userModel,
        apiKeyModel = apiKeyModel,
    )

    @Test
    fun `WHEN systemUser config with apiKey THEN key validates and user exists`() {
        val githubId = "system-user-with-key-${System.nanoTime()}"
        val rawKey = "a".repeat(64)

        initializerWith(SystemUserConfig(githubId = githubId, name = "Bot", email = null, apiKey = rawKey)).run(noArgs)

        val userId = apiKeyClient.validateApiKey(rawKey).userId
        usersClient.getUserRaw(userId).andExpect(status().isOk)
    }

    @Test
    fun `WHEN run twice with same config THEN idempotent - no errors and key still valid`() {
        val githubId = "system-user-idempotent-${System.nanoTime()}"
        val rawKey = "b".repeat(64)
        val config = SystemUserConfig(githubId = githubId, name = "Bot", email = null, apiKey = rawKey)
        val initializer = initializerWith(config)

        initializer.run(noArgs)
        initializer.run(noArgs)

        val response = apiKeyClient.validateApiKey(rawKey)
        assertThat(response.userId, notNullValue())
    }

    @Test
    fun `WHEN apiKey changes THEN old key is rejected and new key validates`() {
        val githubId = "system-user-rotation-${System.nanoTime()}"
        val oldKey = "c".repeat(64)
        val newKey = "d".repeat(64)

        initializerWith(SystemUserConfig(githubId = githubId, name = "Bot", email = null, apiKey = oldKey)).run(noArgs)
        initializerWith(SystemUserConfig(githubId = githubId, name = "Bot", email = null, apiKey = newKey)).run(noArgs)

        apiKeyClient.validateApiKeyRaw(oldKey).andExpect(status().isNotFound)
        val response = apiKeyClient.validateApiKey(newKey)
        assertThat(response.userId, notNullValue())
    }

    @Test
    fun `WHEN run twice with same key THEN lastUsedAt is not reset`() {
        val githubId = "system-user-no-reset-${System.nanoTime()}"
        val rawKey = "e".repeat(64)
        val config = SystemUserConfig(githubId = githubId, name = "Bot", email = null, apiKey = rawKey)
        val initializer = initializerWith(config)

        initializer.run(noArgs)
        val userId = apiKeyClient.validateApiKey(rawKey).userId
        val lastUsedAfterValidation = apiKeyClient.getApiKey(userId).lastUsedAt
        assertThat(lastUsedAfterValidation, notNullValue())

        initializer.run(noArgs)

        val lastUsedAfterRerun = apiKeyClient.getApiKey(userId).lastUsedAt
        assertThat(lastUsedAfterRerun, equalTo(lastUsedAfterValidation))
    }
}
