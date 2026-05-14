package org.genspectrum.dashboardsbackend.model.user

import org.genspectrum.dashboardsbackend.api.PublicUser
import org.genspectrum.dashboardsbackend.api.User
import org.genspectrum.dashboardsbackend.api.UserSyncRequest
import org.genspectrum.dashboardsbackend.controller.NotFoundException
import org.genspectrum.dashboardsbackend.util.now
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class UserModel {
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
