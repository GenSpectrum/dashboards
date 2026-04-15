package org.genspectrum.dashboardsbackend.model.collection

import org.genspectrum.dashboardsbackend.api.Collection
import org.genspectrum.dashboardsbackend.api.CollectionRequest
import org.genspectrum.dashboardsbackend.api.CollectionUpdate
import org.genspectrum.dashboardsbackend.api.FilterObject
import org.genspectrum.dashboardsbackend.api.VariantRequest
import org.genspectrum.dashboardsbackend.api.VariantUpdate
import org.genspectrum.dashboardsbackend.config.DashboardsConfig
import org.genspectrum.dashboardsbackend.controller.BadRequestException
import org.genspectrum.dashboardsbackend.controller.ForbiddenException
import org.genspectrum.dashboardsbackend.controller.NotFoundException
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.notInList
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class CollectionModel(private val dashboardsConfig: DashboardsConfig) {
    fun getCollections(userId: String?, organism: String?): List<Collection> {
        if (organism != null) {
            dashboardsConfig.validateIsValidOrganism(organism)
            dashboardsConfig.validateCollectionsEnabled(organism)
        }
        val query = if (userId == null && organism == null) {
            CollectionEntity.all()
        } else {
            CollectionEntity.find {
                var conditions: Op<Boolean> = Op.TRUE
                if (userId != null) {
                    conditions = conditions and (CollectionTable.ownedBy eq userId)
                }
                if (organism != null) {
                    conditions = conditions and (CollectionTable.organism eq organism)
                }
                conditions
            }
        }

        // Materialize the collections first to avoid re-running the query
        val collectionEntities = query.toList()
        if (collectionEntities.isEmpty()) {
            return emptyList()
        }
        // Batch-load all variants
        val allCollectionIds = collectionEntities.map { it.id }
        val variantsByCollectionId = VariantEntity
            .find { VariantTable.collectionId inList allCollectionIds }
            .groupBy { it.collectionId }
        return collectionEntities.map { collectionEntity ->
            val variants = variantsByCollectionId[collectionEntity.id].orEmpty().map { it.toVariant() }
            Collection(
                id = collectionEntity.id.value,
                name = collectionEntity.name,
                ownedBy = collectionEntity.ownedBy,
                organism = collectionEntity.organism,
                description = collectionEntity.description,
                variants = variants,
            )
        }
    }

    fun getCollection(id: Long): Collection {
        val entity = CollectionEntity.findById(id)
            ?: throw NotFoundException("Collection $id not found")
        return entity.toCollection()
    }

    fun createCollection(request: CollectionRequest, userId: String): Collection {
        dashboardsConfig.validateIsValidOrganism(request.organism)
        dashboardsConfig.validateCollectionsEnabled(request.organism)

        val collectionEntity = CollectionEntity.new {
            name = request.name
            organism = request.organism
            description = request.description
            ownedBy = userId
        }

        val variantEntities = request.variants.map { variantRequest ->
            val variantEntity = createVariantEntity(collectionEntity, variantRequest)
            variantEntity.validate()
            variantEntity
        }

        return Collection(
            id = collectionEntity.id.value,
            name = collectionEntity.name,
            ownedBy = collectionEntity.ownedBy,
            organism = collectionEntity.organism,
            description = collectionEntity.description,
            variants = variantEntities.map { it.toVariant() },
        )
    }

    fun deleteCollection(id: Long, userId: String) {
        // Find with ownership check
        val entity = CollectionEntity.findForUser(id, userId)
            ?: throw ForbiddenException("Collection $id not found or you don't have permission to delete it")

        // Delete (variants cascade automatically via DB constraint)
        entity.delete()
    }

    fun putCollection(id: Long, update: CollectionUpdate, userId: String): Collection {
        val collectionEntity = CollectionEntity.findForUser(id, userId)
            ?: throw ForbiddenException("Collection $id not found or you don't have permission to update it")
        dashboardsConfig.validateCollectionsEnabled(collectionEntity.organism)

        if (update.name != null) {
            collectionEntity.name = update.name
        }

        if (update.description != null) {
            collectionEntity.description = update.description
        }

        if (update.variants != null) {
            // Track which variant IDs should be kept
            val variantIdsToKeep = mutableSetOf<Long>()

            update.variants.forEach { variantUpdate ->
                when (val variantId = variantUpdate.id) {
                    null -> {
                        val variantEntity = createVariantEntity(
                            collectionEntity,
                            variantUpdate.toVariantRequest(),
                        )
                        variantEntity.validate()
                        variantIdsToKeep.add(variantEntity.id.value)
                    }
                    // Case 2: Has ID = Update existing variant
                    else -> {
                        val variantEntity = VariantEntity.findById(variantId)
                            ?: throw BadRequestException(
                                "Variant $variantId not found",
                            )

                        // Verify the variant belongs to this collection
                        if (variantEntity.collectionId.value != id) {
                            throw BadRequestException(
                                "Variant $variantId does not belong to collection $id",
                            )
                        }

                        // Update the variant fields
                        updateVariantEntity(variantEntity, variantUpdate, collectionEntity)
                        variantEntity.validate()
                        variantIdsToKeep.add(variantId)
                    }
                }
            }

            // Case 3: Delete variants not in the update list
            if (variantIdsToKeep.isEmpty()) {
                VariantTable.deleteWhere { collectionId eq id }
            } else {
                // Delete all variants for this collection whose IDs are not in the keep-set
                VariantTable.deleteWhere {
                    (collectionId eq id) and (VariantTable.id notInList variantIdsToKeep.toList())
                }
            }
            VariantEntity.find { VariantTable.collectionId eq id }
                .filter { it.id.value !in variantIdsToKeep }
                .forEach { it.delete() }
        }

        return collectionEntity.toCollection()
    }

    private fun createVariantEntity(collectionEntity: CollectionEntity, variantRequest: VariantRequest): VariantEntity =
        when (variantRequest) {
            is VariantRequest.QueryVariantRequest -> {
                VariantEntity.new {
                    this.collectionId = collectionEntity.id
                    this.variantType = VariantType.QUERY
                    this.name = variantRequest.name
                    this.description = variantRequest.description
                    this.countQuery = variantRequest.countQuery
                    this.coverageQuery = variantRequest.coverageQuery
                    this.filterObject = null
                }
            }
            is VariantRequest.FilterObjectVariantRequest -> {
                validateLineageFilters(collectionEntity.organism, variantRequest.filterObject)

                VariantEntity.new {
                    this.collectionId = collectionEntity.id
                    this.variantType = VariantType.FILTER_OBJECT
                    this.name = variantRequest.name
                    this.description = variantRequest.description
                    this.filterObject = variantRequest.filterObject
                    this.countQuery = null
                    this.coverageQuery = null
                }
            }
        }

    /**
     * The list of known lineage fields is configured in the organism config.
     * This function checks a FilterObject against that list, and raises an error
     * if invalid lineage fields are found.
     */
    private fun validateLineageFilters(organism: String, filterObject: FilterObject) {
        val validLineageFields = dashboardsConfig.getOrganismConfig(organism).lapis.lineageFields ?: emptyList()
        val invalidFields = filterObject.getFilters().keys - validLineageFields.toSet()
        if (invalidFields.isNotEmpty()) {
            val validFieldsStr = if (validLineageFields.isEmpty()) {
                "no lineage fields are configured"
            } else {
                "valid fields are: ${validLineageFields.joinToString(", ")}"
            }
            throw BadRequestException(
                "Invalid lineage fields for organism '$organism': ${invalidFields.joinToString(", ")}. $validFieldsStr",
            )
        }
    }

    private fun updateVariantEntity(
        variantEntity: VariantEntity,
        variantUpdate: VariantUpdate,
        collectionEntity: CollectionEntity,
    ) {
        when (variantUpdate) {
            is VariantUpdate.QueryVariantUpdate -> {
                // Verify type matches
                if (variantEntity.variantType != VariantType.QUERY) {
                    throw BadRequestException(
                        "Cannot change variant type from ${variantEntity.variantType} to QUERY",
                    )
                }
                variantEntity.name = variantUpdate.name
                variantEntity.description = variantUpdate.description
                variantEntity.countQuery = variantUpdate.countQuery
                variantEntity.coverageQuery = variantUpdate.coverageQuery
            }
            is VariantUpdate.FilterObjectVariantUpdate -> {
                // Verify type matches
                if (variantEntity.variantType != VariantType.FILTER_OBJECT) {
                    throw BadRequestException(
                        "Cannot change variant type from ${variantEntity.variantType} to FILTER_OBJECT",
                    )
                }

                validateLineageFilters(collectionEntity.organism, variantUpdate.filterObject)

                variantEntity.name = variantUpdate.name
                variantEntity.description = variantUpdate.description
                variantEntity.filterObject = variantUpdate.filterObject
            }
        }
    }
}
