package org.genspectrum.dashboardsbackend.model.user

import org.genspectrum.dashboardsbackend.api.User
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.dao.id.EntityID
import org.jetbrains.exposed.v1.core.dao.id.LongIdTable
import org.jetbrains.exposed.v1.dao.LongEntity
import org.jetbrains.exposed.v1.dao.LongEntityClass
import org.jetbrains.exposed.v1.datetime.timestamp

const val USER_TABLE = "users_table"

object UserTable : LongIdTable(USER_TABLE) {
    val githubId = varchar("github_id", 255).nullable().uniqueIndex()
    val name = varchar("name", 255)
    val email = varchar("email", 255).nullable()
    val createdAt = timestamp("created_at")
    val updatedAt = timestamp("updated_at")
}

class UserEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<UserEntity>(UserTable) {
        fun findByGithubId(githubId: String) = find { UserTable.githubId eq githubId }.firstOrNull()
    }

    var githubId by UserTable.githubId
    var name by UserTable.name
    var email by UserTable.email
    var createdAt by UserTable.createdAt
    var updatedAt by UserTable.updatedAt

    fun toUser() = User(
        id = id.value,
        githubId = githubId,
        name = name,
        email = email,
        createdAt = createdAt,
        updatedAt = updatedAt,
    )
}
