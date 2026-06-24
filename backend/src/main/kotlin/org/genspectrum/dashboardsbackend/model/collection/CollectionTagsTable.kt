package org.genspectrum.dashboardsbackend.model.collection

import org.jetbrains.exposed.v1.core.Column
import org.jetbrains.exposed.v1.core.Function
import org.jetbrains.exposed.v1.core.QueryBuilder
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.TextColumnType

object CollectionTagsTable : Table("collection_tags") {
    val collectionId = reference("collection_id", CollectionTable, onDelete = ReferenceOption.CASCADE)
    val tag = text("tag")
    override val primaryKey = PrimaryKey(collectionId, tag)
}

class StringAgg(
    private val column: Column<String>,
    private val distinct: Boolean = false,
    private val orderBy: Boolean = false,
) : Function<String?>(TextColumnType()) {
    override fun toQueryBuilder(queryBuilder: QueryBuilder) = queryBuilder {
        append("string_agg(")
        if (distinct) append("DISTINCT ")
        append(column)
        append(", ','")
        if (orderBy && !distinct) {
            append(" ORDER BY ")
            append(column)
        }
        append(")")
    }
}
