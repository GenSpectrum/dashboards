package org.genspectrum.dashboardsbackend.model.collection

import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

object CollectionTagsTable : Table("collection_tags") {
    val collectionId = reference("collection_id", CollectionTable, onDelete = ReferenceOption.CASCADE)
    val tag = text("tag")
    override val primaryKey = PrimaryKey(collectionId, tag)
}
