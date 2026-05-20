package org.genspectrum.dashboardsbackend.model.apikey

import org.genspectrum.dashboardsbackend.api.ApiKeyMetadata
import org.genspectrum.dashboardsbackend.api.GeneratedApiKey
import org.genspectrum.dashboardsbackend.controller.ConflictException
import org.genspectrum.dashboardsbackend.controller.NotFoundException
import org.genspectrum.dashboardsbackend.model.user.UserEntity
import org.genspectrum.dashboardsbackend.util.now
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.MessageDigest
import java.security.SecureRandom

@Service
@Transactional
class ApiKeyModel {
    private val secureRandom = SecureRandom()
    fun getApiKey(userId: Long): ApiKeyMetadata = ApiKeyEntity.findByUserId(userId)?.toMetadata()
        ?: throw NotFoundException("No API key found for user $userId")

    /**
     * Generates a 32-byte cryptographically random key, stores its SHA-256 digest, and returns the
     * raw key to the caller. The raw key is never persisted and cannot be retrieved again.
     */
    fun generateApiKey(userId: Long): GeneratedApiKey {
        UserEntity.findById(userId) ?: throw NotFoundException("User $userId not found")
        if (ApiKeyEntity.findByUserId(userId) != null) {
            throw ConflictException("An API key already exists for user $userId")
        }

        val rawKey = generateRawKey()
        val now = now()

        ApiKeyEntity.new {
            this.userId = userId
            this.keyHash = sha256(rawKey)
            this.createdAt = now
            this.lastUsedAt = null
        }

        return GeneratedApiKey(key = rawKey, createdAt = now)
    }

    fun revokeApiKey(userId: Long) {
        val entity = ApiKeyEntity.findByUserId(userId)
            ?: throw NotFoundException("No API key found for user $userId")
        entity.delete()
    }

    /** Hashes [key], looks it up, updates [ApiKeyTable.lastUsedAt], and returns the owner's user ID. */
    fun validateApiKey(key: String): Long {
        val entity = ApiKeyEntity.findByKeyHash(sha256(key))
            ?: throw NotFoundException("Invalid API key")
        entity.lastUsedAt = now()
        return entity.userId
    }

    private fun generateRawKey(): String {
        val bytes = ByteArray(32)
        secureRandom.nextBytes(bytes)
        return bytes.joinToString("") { "%02x".format(it) }
    }

    private fun sha256(input: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
