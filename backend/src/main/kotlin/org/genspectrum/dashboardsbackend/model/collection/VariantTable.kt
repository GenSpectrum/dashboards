package org.genspectrum.dashboardsbackend.model.collection

import org.genspectrum.dashboardsbackend.api.FilterObject
import org.genspectrum.dashboardsbackend.api.Variant
import org.genspectrum.dashboardsbackend.model.subscription.jacksonSerializableJsonb
import org.jetbrains.exposed.dao.LongEntity
import org.jetbrains.exposed.dao.LongEntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.LongIdTable
import org.jetbrains.exposed.sql.ReferenceOption

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
                require(mutationList == null) { "Query variant must not have mutation_list" }
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
        )
        VariantType.FILTER_OBJECT -> Variant.MutationListVariant(
            id = id.value,
            collectionId = collectionId.value,
            name = name,
            description = description,
            filterObject = filterObject!!,
        )
    }
}
