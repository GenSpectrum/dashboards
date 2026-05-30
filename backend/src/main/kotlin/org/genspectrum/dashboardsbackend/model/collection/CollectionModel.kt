package org.genspectrum.dashboardsbackend.model.collection

import org.genspectrum.dashboardsbackend.api.Collection
import org.genspectrum.dashboardsbackend.api.CollectionRequest
import org.genspectrum.dashboardsbackend.api.CollectionUpdate
import org.genspectrum.dashboardsbackend.api.FilterObject
import org.genspectrum.dashboardsbackend.api.VariantRequest
import org.genspectrum.dashboardsbackend.api.VariantUpdate
import org.genspectrum.dashboardsbackend.config.DashboardsConfig
import org.genspectrum.dashboardsbackend.config.SystemUserInitializer
import org.genspectrum.dashboardsbackend.controller.BadRequestException
import org.genspectrum.dashboardsbackend.controller.ForbiddenException
import org.genspectrum.dashboardsbackend.controller.NotFoundException
import org.genspectrum.dashboardsbackend.model.user.UserEntity
import org.genspectrum.dashboardsbackend.util.now
import org.jetbrains.exposed.v1.core.JoinType
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.count
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.core.notInList
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import kotlin.time.Instant

@Service
@Transactional
class CollectionModel(
    private val dashboardsConfig: DashboardsConfig,
    private val systemUserInitializer: SystemUserInitializer,
) {
    fun getCollections(
        userId: Long?,
        organism: String?,
        includeVariants: Boolean = false,
        excludeSystemCollections: Boolean = false,
    ): List<Collection> {
        if (userId != null) {
            UserEntity.findById(userId) ?: throw NotFoundException("User $userId not found")
        }
        if (organism != null) {
            dashboardsConfig.validateIsValidOrganism(organism)
            dashboardsConfig.validateCollectionsEnabled(organism)
        }

        var collectionConditions: Op<Boolean> = Op.TRUE
        if (userId != null) {
            collectionConditions = collectionConditions and (CollectionTable.ownedBy eq userId)
        }
        if (organism != null) {
            collectionConditions = collectionConditions and (CollectionTable.organism eq organism)
        }
        if (excludeSystemCollections) {
            val systemUserId = systemUserInitializer.getSystemUserId()
            if (systemUserId != null) {
                collectionConditions = collectionConditions and (CollectionTable.ownedBy neq systemUserId)
            }
        }

        val join = CollectionTable.join(VariantTable, JoinType.LEFT)

        return if (includeVariants) {
            join.selectAll()
                .where { collectionConditions }
                .groupBy { it[CollectionTable.id] }
                .map { (_, rows) ->
                    val first = rows.first()
                    val variants = rows.mapNotNull { row ->
                        row.getOrNull(VariantTable.id)?.let { row.toVariant() }
                    }
                    Collection(
                        id = first[CollectionTable.id].value,
                        name = first[CollectionTable.name],
                        ownedBy = first[CollectionTable.ownedBy],
                        organism = first[CollectionTable.organism],
                        description = first[CollectionTable.description],
                        variantCount = variants.size,
                        variants = variants,
                        createdAt = first[CollectionTable.createdAt],
                        updatedAt = first[CollectionTable.updatedAt],
                    )
                }
        } else {
            val countExpr = VariantTable.id.count()
            join.select(
                CollectionTable.id,
                CollectionTable.name,
                CollectionTable.ownedBy,
                CollectionTable.organism,
                CollectionTable.description,
                CollectionTable.createdAt,
                CollectionTable.updatedAt,
                countExpr,
            )
                .where { collectionConditions }
                .groupBy(
                    CollectionTable.id,
                    CollectionTable.name,
                    CollectionTable.ownedBy,
                    CollectionTable.organism,
                    CollectionTable.description,
                    CollectionTable.createdAt,
                    CollectionTable.updatedAt,
                )
                .map { row ->
                    Collection(
                        id = row[CollectionTable.id].value,
                        name = row[CollectionTable.name],
                        ownedBy = row[CollectionTable.ownedBy],
                        organism = row[CollectionTable.organism],
                        description = row[CollectionTable.description],
                        variantCount = row[countExpr].toInt(),
                        variants = null,
                        createdAt = row[CollectionTable.createdAt],
                        updatedAt = row[CollectionTable.updatedAt],
                    )
                }
        }
    }

    fun getCollection(id: Long): Collection {
        val entity = CollectionEntity.findById(id)
            ?: throw NotFoundException("Collection $id not found")
        return entity.toCollection()
    }

    fun createCollection(request: CollectionRequest, userId: Long): Collection {
        UserEntity.findById(userId) ?: throw NotFoundException("User $userId not found")
        dashboardsConfig.validateIsValidOrganism(request.organism)
        dashboardsConfig.validateCollectionsEnabled(request.organism)

        val now = now()
        val collectionEntity = CollectionEntity.new {
            name = request.name
            organism = request.organism
            description = request.description
            ownedBy = userId
            createdAt = now
            updatedAt = now
        }

        val variantEntities = request.variants.map { variantRequest ->
            val variantEntity = createVariantEntity(collectionEntity, variantRequest, now)
            variantEntity.validate()
            variantEntity
        }

        val variants = variantEntities.map { it.toVariant() }
        return Collection(
            id = collectionEntity.id.value,
            name = collectionEntity.name,
            ownedBy = collectionEntity.ownedBy,
            organism = collectionEntity.organism,
            description = collectionEntity.description,
            variantCount = variants.size,
            variants = variants,
            createdAt = collectionEntity.createdAt,
            updatedAt = collectionEntity.updatedAt,
        )
    }

    fun deleteCollection(id: Long, userId: Long) {
        // Find with ownership check
        val entity = CollectionEntity.findForUser(id, userId)
            ?: throw ForbiddenException("Collection $id not found or you don't have permission to delete it")

        // Delete (variants cascade automatically via DB constraint)
        entity.delete()
    }

    fun putCollection(id: Long, update: CollectionUpdate, userId: Long): Collection {
        val collectionEntity = CollectionEntity.findForUser(id, userId)
            ?: throw ForbiddenException("Collection $id not found or you don't have permission to update it")
        dashboardsConfig.validateCollectionsEnabled(collectionEntity.organism)

        val now = now()
        collectionEntity.updatedAt = now

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
                            now,
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
                        updateVariantEntity(variantEntity, variantUpdate, collectionEntity, now)
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

    private fun createVariantEntity(
        collectionEntity: CollectionEntity,
        variantRequest: VariantRequest,
        now: Instant,
    ): VariantEntity = when (variantRequest) {
        is VariantRequest.QueryVariantRequest -> {
            VariantEntity.new {
                this.collectionId = collectionEntity.id
                this.variantType = VariantType.QUERY
                this.name = variantRequest.name
                this.description = variantRequest.description
                this.countQuery = variantRequest.countQuery
                this.coverageQuery = variantRequest.coverageQuery
                this.filterObject = null
                this.createdAt = now
                this.updatedAt = now
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
                this.createdAt = now
                this.updatedAt = now
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
        now: Instant,
    ) {
        variantEntity.updatedAt = now
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
