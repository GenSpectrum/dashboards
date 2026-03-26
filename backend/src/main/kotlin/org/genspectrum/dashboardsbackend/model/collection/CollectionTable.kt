package org.genspectrum.dashboardsbackend.model.collection

import org.genspectrum.dashboardsbackend.api.Collection
import org.jetbrains.exposed.dao.LongEntity
import org.jetbrains.exposed.dao.LongEntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.LongIdTable
import org.jetbrains.exposed.sql.kotlin.datetime.timestamp

const val COLLECTION_TABLE = "collections_table"

object CollectionTable : LongIdTable(COLLECTION_TABLE) {
    val name = text("name")
    val ownedBy = varchar("owned_by", 255)
    val organism = varchar("organism", 255)
    val description = text("description").nullable()
    val createdAt = timestamp("created_at")
    val updatedAt = timestamp("updated_at")
}

class CollectionEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<CollectionEntity>(CollectionTable) {
        fun findForUser(id: Long, userId: String) = findById(id)
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

    fun toCollection() = Collection(
        id = id.value,
        name = name,
        ownedBy = ownedBy,
        organism = organism,
        description = description,
        variants = variants.map { it.toVariant() },
        createdAt = createdAt,
        updatedAt = updatedAt,
    )
}
