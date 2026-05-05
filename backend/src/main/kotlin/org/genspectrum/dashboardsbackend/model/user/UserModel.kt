package org.genspectrum.dashboardsbackend.model.user

import org.genspectrum.dashboardsbackend.api.User
import org.genspectrum.dashboardsbackend.api.UserSyncRequest
import org.genspectrum.dashboardsbackend.controller.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import kotlin.time.Clock
import kotlin.time.Instant

@Service
@Transactional
class UserModel {
    // Truncate to milliseconds to avoid mismatches between the in-memory value
    // we return and what is read back from the DB.
    private fun now(): Instant = Clock.System.now().run {
        Instant.fromEpochMilliseconds(toEpochMilliseconds())
    }
    // TODO - function above is probably already present elsewhere?
    // feels like this utitlity fn shouldn't just be here.

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

    // TODO - this is the function we call from the controller. We shouldn't return
    // the email - we should keep it internal.
    fun getUser(id: Long): User = UserEntity.findById(id)?.toUser()
        ?: throw NotFoundException("User $id not found")
}
