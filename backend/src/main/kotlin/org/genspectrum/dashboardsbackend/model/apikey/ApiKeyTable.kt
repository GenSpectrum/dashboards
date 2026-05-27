package org.genspectrum.dashboardsbackend.model.apikey

import org.genspectrum.dashboardsbackend.api.ApiKeyMetadata
import org.jetbrains.exposed.v1.core.dao.id.EntityID
import org.jetbrains.exposed.v1.core.dao.id.java.UUIDTable
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.dao.java.UUIDEntity
import org.jetbrains.exposed.v1.dao.java.UUIDEntityClass
import org.jetbrains.exposed.v1.datetime.timestamp
import java.util.UUID

const val API_KEY_TABLE = "api_keys_table"

/**
 * This table stores API keys for users, which they can use to access the API without
 * session cookies etc.
 * One row per user. The raw key is never stored — only its SHA-256 hex digest.
 * The unique index on [userId] enforces the one-key-per-user constraint at the DB level.
 */
object ApiKeyTable : UUIDTable(API_KEY_TABLE) {
    val userId = long("user_id").uniqueIndex()
    val keyHash = varchar("key_hash", 64)
    val createdAt = timestamp("created_at")
    val lastUsedAt = timestamp("last_used_at").nullable()
}

class ApiKeyEntity(id: EntityID<UUID>) : UUIDEntity(id) {
    companion object : UUIDEntityClass<ApiKeyEntity>(ApiKeyTable) {
        fun findByUserId(userId: Long) = find { ApiKeyTable.userId eq userId }.firstOrNull()
        fun findByKeyHash(keyHash: String) = find { ApiKeyTable.keyHash eq keyHash }.firstOrNull()
    }

    var userId by ApiKeyTable.userId
    var keyHash by ApiKeyTable.keyHash
    var createdAt by ApiKeyTable.createdAt
    var lastUsedAt by ApiKeyTable.lastUsedAt

    fun toMetadata() = ApiKeyMetadata(createdAt = createdAt, lastUsedAt = lastUsedAt)
}
