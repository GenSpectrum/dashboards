package org.genspectrum.dashboardsbackend.model.collection

import org.genspectrum.dashboardsbackend.api.FilterObject
import org.genspectrum.dashboardsbackend.api.Variant
import org.genspectrum.dashboardsbackend.model.subscription.jacksonSerializableJsonb
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.EntityID
import org.jetbrains.exposed.v1.core.dao.id.LongIdTable
import org.jetbrains.exposed.v1.dao.LongEntity
import org.jetbrains.exposed.v1.dao.LongEntityClass
import org.jetbrains.exposed.v1.datetime.timestamp

const val VARIANT_TABLE = "variants_table"

enum class VariantType {
    QUERY,
    FILTER_OBJECT,
    ;

    fun toDatabaseValue(): String = when (this) {
        QUERY -> "query"
        FILTER_OBJECT -> "filterObject"
    }

    companion object {
        fun fromDatabaseValue(value: String): VariantType = when (value) {
            "query" -> QUERY
            "filterObject" -> FILTER_OBJECT
            else -> throw IllegalArgumentException("Unknown variant type: $value")
        }
    }
}

object VariantTable : LongIdTable(VARIANT_TABLE) {
    val collectionId = reference(
        "collection_id",
        CollectionTable,
        onDelete = ReferenceOption.CASCADE,
    )
    val variantType = varchar("variant_type", 50)
    val name = text("name")
    val description = text("description").nullable()

    val countQuery = text("count_query").nullable()
    val coverageQuery = text("coverage_query").nullable()

    val filterObject = jacksonSerializableJsonb<FilterObject>(
        "filter_object",
    ).nullable()

    val createdAt = timestamp("created_at")
    val updatedAt = timestamp("updated_at")
}

class VariantEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<VariantEntity>(VariantTable)

    var collectionId by VariantTable.collectionId
    private var variantTypeString by VariantTable.variantType
    var name by VariantTable.name
    var description by VariantTable.description

    // Polymorphic property access
    var countQuery by VariantTable.countQuery
    var coverageQuery by VariantTable.coverageQuery
    var filterObject by VariantTable.filterObject
    var createdAt by VariantTable.createdAt
    var updatedAt by VariantTable.updatedAt

    // Type-safe variant type accessor
    var variantType: VariantType
        get() = VariantType.fromDatabaseValue(variantTypeString)
        set(value) {
            variantTypeString = value.toDatabaseValue()
        }

    // Validation helper
    fun validate() {
        when (variantType) {
            VariantType.QUERY -> {
                require(countQuery != null) { "Query variant must have count_query" }
                require(filterObject == null) { "Query variant must not have filter_object" }
            }
            VariantType.FILTER_OBJECT -> {
                require(filterObject != null) { "FilterObject variant must have filter_object" }
                require(countQuery == null && coverageQuery == null) {
                    "FilterObject variant must not have query columns"
                }
            }
        }
    }

    fun toVariant(): Variant = when (variantType) {
        VariantType.QUERY -> Variant.QueryVariant(
            id = id.value,
            collectionId = collectionId.value,
            name = name,
            description = description,
            countQuery = countQuery!!,
            coverageQuery = coverageQuery,
            createdAt = createdAt,
            updatedAt = updatedAt,
        )
        VariantType.FILTER_OBJECT -> Variant.FilterObjectVariant(
            id = id.value,
            collectionId = collectionId.value,
            name = name,
            description = description,
            filterObject = filterObject!!,
            createdAt = createdAt,
            updatedAt = updatedAt,
        )
    }
}

/**
 * Maps a raw ResultRow from a JOIN query to a Variant, as an alternative to [VariantEntity.toVariant]
 * which requires the DAO layer.
 **/
fun ResultRow.toVariant(): Variant {
    val variantType = VariantType.fromDatabaseValue(this[VariantTable.variantType])
    return when (variantType) {
        VariantType.QUERY -> Variant.QueryVariant(
            id = this[VariantTable.id].value,
            collectionId = this[VariantTable.collectionId].value,
            name = this[VariantTable.name],
            description = this[VariantTable.description],
            countQuery = this[VariantTable.countQuery]!!,
            coverageQuery = this[VariantTable.coverageQuery],
            createdAt = this[VariantTable.createdAt],
            updatedAt = this[VariantTable.updatedAt],
        )
        VariantType.FILTER_OBJECT -> Variant.FilterObjectVariant(
            id = this[VariantTable.id].value,
            collectionId = this[VariantTable.collectionId].value,
            name = this[VariantTable.name],
            description = this[VariantTable.description],
            filterObject = this[VariantTable.filterObject]!!,
            createdAt = this[VariantTable.createdAt],
            updatedAt = this[VariantTable.updatedAt],
        )
    }
}
