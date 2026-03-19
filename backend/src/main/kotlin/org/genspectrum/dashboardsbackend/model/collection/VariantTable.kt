package org.genspectrum.dashboardsbackend.model.collection

import org.genspectrum.dashboardsbackend.api.MutationListDefinition
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
    MUTATION_LIST,
    ;

    fun toDatabaseValue(): String = when (this) {
        QUERY -> "query"
        MUTATION_LIST -> "mutationList"
    }

    companion object {
        fun fromDatabaseValue(value: String): VariantType = when (value) {
            "query" -> QUERY
            "mutationList" -> MUTATION_LIST
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

    val mutationList = jacksonSerializableJsonb<MutationListDefinition>(
        "mutation_list",
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
    var mutationList by VariantTable.mutationList

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
            VariantType.MUTATION_LIST -> {
                require(mutationList != null) { "MutationList variant must have mutation_list" }
                require(countQuery == null && coverageQuery == null) {
                    "MutationList variant must not have query columns"
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
        VariantType.MUTATION_LIST -> Variant.MutationListVariant(
            id = id.value,
            collectionId = collectionId.value,
            name = name,
            description = description,
            mutationList = mutationList!!,
        )
    }
}
