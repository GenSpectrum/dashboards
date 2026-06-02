package org.genspectrum.dashboardsbackend.model.user

import org.genspectrum.dashboardsbackend.api.PublicUser
import org.genspectrum.dashboardsbackend.api.User
import org.genspectrum.dashboardsbackend.api.UserSyncRequest
import org.genspectrum.dashboardsbackend.config.DashboardsConfig
import org.genspectrum.dashboardsbackend.controller.NotFoundException
import org.genspectrum.dashboardsbackend.util.now
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class UserModel(private val dashboardsConfig: DashboardsConfig) {
    // Not `lazy {}` — needs @Transactional to run inside a DB transaction.
    @Volatile
    private var systemUserId: Long? = null

    fun getSystemUserId(): Long? {
        systemUserId?.let { return it }
        val githubId = dashboardsConfig.systemUser?.githubId ?: return null
        val id = UserEntity.findByGithubId(githubId)?.id?.value ?: return null
        systemUserId = id
        return id
    }

    fun syncUser(request: UserSyncRequest): User {
        val now = now()
        val existing = UserEntity.findByGithubId(request.githubId)
        return if (existing != null) {
            existing.name = request.name
            existing.email = request.email
            existing.updatedAt = now
            existing.toUser()
        } else {
            UserEntity.new {
                githubId = request.githubId
                name = request.name
                email = request.email
                createdAt = now
                updatedAt = now
            }.toUser()
        }
    }

    fun getUser(id: Long): PublicUser = UserEntity.findById(id)?.toPublicUser()
        ?: throw NotFoundException("User $id not found")
}
