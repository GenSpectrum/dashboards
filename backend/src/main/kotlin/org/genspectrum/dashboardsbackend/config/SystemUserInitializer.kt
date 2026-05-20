package org.genspectrum.dashboardsbackend.config

import mu.KotlinLogging
import org.genspectrum.dashboardsbackend.api.UserSyncRequest
import org.genspectrum.dashboardsbackend.model.apikey.ApiKeyModel
import org.genspectrum.dashboardsbackend.model.user.UserModel
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.stereotype.Component

private val log = KotlinLogging.logger {}

@Component
class SystemUserInitializer(
    private val dashboardsConfig: DashboardsConfig,
    private val userModel: UserModel,
    private val apiKeyModel: ApiKeyModel,
) : ApplicationRunner {
    override fun run(args: ApplicationArguments) {
        val config = dashboardsConfig.systemUser ?: return
        val user = userModel.syncUser(
            UserSyncRequest(githubId = config.githubId, name = config.name, email = config.email),
        )
        log.info { "System user ready: id=${user.id}, githubId=${config.githubId}, name=${config.name}" }
        config.apiKey?.let {
            apiKeyModel.upsertApiKey(userId = user.id, rawKey = it)
            log.info { "System user API key upserted for userId=${user.id}" }
        }
    }
}
