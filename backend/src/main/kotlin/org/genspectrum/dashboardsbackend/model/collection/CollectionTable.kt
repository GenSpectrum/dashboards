package org.genspectrum.dashboardsbackend.model.collection

import org.genspectrum.dashboardsbackend.api.Collection
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.dao.id.EntityID
import org.jetbrains.exposed.v1.core.dao.id.LongIdTable
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.dao.LongEntity
import org.jetbrains.exposed.v1.dao.LongEntityClass
import org.jetbrains.exposed.v1.datetime.timestamp
import org.jetbrains.exposed.v1.jdbc.selectAll

const val COLLECTION_TABLE = "collections_table"

object CollectionTable : LongIdTable(COLLECTION_TABLE) {
    val name = text("name")
    val ownedBy = long("owned_by")
    val organism = varchar("organism", 255)
    val description = text("description").nullable()
    val createdAt = timestamp("created_at")
    val updatedAt = timestamp("updated_at")
}

class CollectionEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<CollectionEntity>(CollectionTable) {
        fun findForUser(id: Long, userId: Long) = findById(id)
            ?.takeIf { it.ownedBy == userId }
    }

    var name by CollectionTable.name
    var ownedBy by CollectionTable.ownedBy
    var organism by CollectionTable.organism
    var description by CollectionTable.description
    var createdAt by CollectionTable.createdAt
    var updatedAt by CollectionTable.updatedAt

    // Navigation property to access variants
    val variants by VariantEntity referrersOn VariantTable.collectionId

    fun toCollection(): Collection {
        val variantList = variants.map { it.toVariant() }
        val tagList = CollectionTagsTable
            .selectAll()
            .where { CollectionTagsTable.collectionId eq id.value }
            .orderBy(CollectionTagsTable.tag to SortOrder.ASC)
            .map { it[CollectionTagsTable.tag] }
        return Collection(
            id = id.value,
            name = name,
            ownedBy = ownedBy,
            organism = organism,
            description = description,
            variantCount = variantList.size,
            variants = variantList,
            tags = tagList,
            createdAt = createdAt,
            updatedAt = updatedAt,
        )
    }
}
