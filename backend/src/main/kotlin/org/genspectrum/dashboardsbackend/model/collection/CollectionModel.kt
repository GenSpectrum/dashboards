package org.genspectrum.dashboardsbackend.model.collection

import org.genspectrum.dashboardsbackend.api.Collection
import org.genspectrum.dashboardsbackend.api.CollectionRequest
import org.genspectrum.dashboardsbackend.api.CollectionUpdate
import org.genspectrum.dashboardsbackend.api.VariantRequest
import org.genspectrum.dashboardsbackend.api.VariantUpdate
import org.genspectrum.dashboardsbackend.config.DashboardsConfig
import org.genspectrum.dashboardsbackend.config.validateIsValidOrganism
import org.genspectrum.dashboardsbackend.controller.ForbiddenException
import org.genspectrum.dashboardsbackend.controller.NotFoundException
import org.genspectrum.dashboardsbackend.util.convertToUuid
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.and
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID
import javax.sql.DataSource

@Service
@Transactional
class CollectionModel(pool: DataSource, private val dashboardsConfig: DashboardsConfig) {
    init {
        Database.connect(pool)
    }

    fun getCollections(userId: String?, organism: String?): List<Collection> {
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

        return query.map { it.toCollection() }
    }

    fun getCollection(id: String): Collection = CollectionEntity.findById(convertToUuid(id))
        ?.toCollection()
        ?: throw NotFoundException("Collection $id not found")

    fun createCollection(request: CollectionRequest, userId: String): Collection {
        dashboardsConfig.validateIsValidOrganism(request.organism)

        val collectionEntity = CollectionEntity.new {
            name = request.name
            organism = request.organism
            description = request.description
            ownedBy = userId
        }

        val variantEntities = request.variants.map { variantRequest ->
            val variantEntity = when (variantRequest) {
                is VariantRequest.QueryVariantRequest -> {
                    VariantEntity.new {
                        this.collectionId = collectionEntity.id
                        this.variantType = VariantType.QUERY
                        this.name = variantRequest.name
                        this.description = variantRequest.description
                        this.countQuery = variantRequest.countQuery
                        this.coverageQuery = variantRequest.coverageQuery
                        this.mutationList = null
                    }
                }
                is VariantRequest.MutationListVariantRequest -> {
                    // Validate lineage filters
                    val organismConfig = dashboardsConfig.getOrganismConfig(request.organism)
                    val validLineageFields = organismConfig.lapis.lineageFields ?: emptyList()

                    val invalidFields = variantRequest.mutationList.lineageFilters.keys - validLineageFields.toSet()
                    if (invalidFields.isNotEmpty()) {
                        val validFieldsStr = if (validLineageFields.isEmpty()) {
                            "no lineage fields are configured"
                        } else {
                            "valid fields are: ${validLineageFields.joinToString(", ")}"
                        }
                        throw org.genspectrum.dashboardsbackend.controller.BadRequestException(
                            "Invalid lineage fields for organism '${request.organism}': ${invalidFields.joinToString(
                                ", ",
                            )}. $validFieldsStr",
                        )
                    }

                    VariantEntity.new {
                        this.collectionId = collectionEntity.id
                        this.variantType = VariantType.MUTATION_LIST
                        this.name = variantRequest.name
                        this.description = variantRequest.description
                        this.mutationList = variantRequest.mutationList
                        this.countQuery = null
                        this.coverageQuery = null
                    }
                }
            }
            variantEntity.validate()
            variantEntity
        }

        return Collection(
            id = collectionEntity.id.value.toString(),
            name = collectionEntity.name,
            ownedBy = collectionEntity.ownedBy,
            organism = collectionEntity.organism,
            description = collectionEntity.description,
            variants = variantEntities.map { it.toVariant() },
        )
    }

    fun deleteCollection(id: String, userId: String) {
        val uuid = convertToUuid(id)

        // Find with ownership check
        val entity = CollectionEntity.findForUser(uuid, userId)
            ?: throw ForbiddenException("Collection $id not found or you don't have permission to delete it")

        // Delete (variants cascade automatically via DB constraint)
        entity.delete()
    }

    fun putCollection(id: String, update: CollectionUpdate, userId: String): Collection {
        val uuid = convertToUuid(id)

        val collectionEntity = CollectionEntity.findForUser(uuid, userId)
            ?: throw ForbiddenException("Collection $id not found or you don't have permission to update it")

        if (update.name != null) {
            collectionEntity.name = update.name
        }

        if (update.description != null) {
            collectionEntity.description = update.description
        }

        if (update.variants != null) {
            // Track which variant IDs should be kept
            val variantIdsToKeep = mutableSetOf<UUID>()

            update.variants.forEach { variantUpdate ->
                when {
                    variantUpdate.id == null -> {
                        val variantEntity = createVariantEntity(
                            collectionEntity,
                            variantUpdate,
                        )
                        variantEntity.validate()
                        variantIdsToKeep.add(variantEntity.id.value)
                    }
                    // Case 2: Has ID = Update existing variant
                    else -> {
                        val idString = variantUpdate.id!!
                        val variantId = convertToUuid(idString)
                        val variantEntity = VariantEntity.findById(variantId)
                            ?: throw org.genspectrum.dashboardsbackend.controller.BadRequestException(
                                "Variant $idString not found",
                            )

                        // Verify the variant belongs to this collection
                        if (variantEntity.collectionId.value != uuid) {
                            throw org.genspectrum.dashboardsbackend.controller.BadRequestException(
                                "Variant ${variantUpdate.id} does not belong to collection $id",
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
            VariantEntity.find { VariantTable.collectionId eq uuid }
                .filter { it.id.value !in variantIdsToKeep }
                .forEach { it.delete() }
        }

        return collectionEntity.toCollection()
    }

    private fun createVariantEntity(collectionEntity: CollectionEntity, variantUpdate: VariantUpdate): VariantEntity =
        when (variantUpdate) {
            is VariantUpdate.QueryVariantUpdate -> {
                VariantEntity.new {
                    this.collectionId = collectionEntity.id
                    this.variantType = VariantType.QUERY
                    this.name = variantUpdate.name
                    this.description = variantUpdate.description
                    this.countQuery = variantUpdate.countQuery
                    this.coverageQuery = variantUpdate.coverageQuery
                    this.mutationList = null
                }
            }
            is VariantUpdate.MutationListVariantUpdate -> {
                // Validate lineage filters
                val organismConfig = dashboardsConfig.getOrganismConfig(collectionEntity.organism)
                val validLineageFields = organismConfig.lapis.lineageFields ?: emptyList()

                val invalidFields =
                    variantUpdate.mutationList.lineageFilters.keys - validLineageFields.toSet()
                if (invalidFields.isNotEmpty()) {
                    val validFieldsStr = if (validLineageFields.isEmpty()) {
                        "no lineage fields are configured"
                    } else {
                        "valid fields are: ${validLineageFields.joinToString(", ")}"
                    }
                    throw org.genspectrum.dashboardsbackend.controller.BadRequestException(
                        "Invalid lineage fields for organism '${collectionEntity.organism}': " +
                            "${invalidFields.joinToString(", ")}. $validFieldsStr",
                    )
                }

                VariantEntity.new {
                    this.collectionId = collectionEntity.id
                    this.variantType = VariantType.MUTATION_LIST
                    this.name = variantUpdate.name
                    this.description = variantUpdate.description
                    this.mutationList = variantUpdate.mutationList
                    this.countQuery = null
                    this.coverageQuery = null
                }
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
                    throw org.genspectrum.dashboardsbackend.controller.BadRequestException(
                        "Cannot change variant type from ${variantEntity.variantType} to QUERY",
                    )
                }
                variantEntity.name = variantUpdate.name
                variantEntity.description = variantUpdate.description
                variantEntity.countQuery = variantUpdate.countQuery
                variantEntity.coverageQuery = variantUpdate.coverageQuery
            }
            is VariantUpdate.MutationListVariantUpdate -> {
                // Verify type matches
                if (variantEntity.variantType != VariantType.MUTATION_LIST) {
                    throw org.genspectrum.dashboardsbackend.controller.BadRequestException(
                        "Cannot change variant type from ${variantEntity.variantType} to MUTATION_LIST",
                    )
                }

                // Validate lineage filters
                val organismConfig = dashboardsConfig.getOrganismConfig(collectionEntity.organism)
                val validLineageFields = organismConfig.lapis.lineageFields ?: emptyList()

                val invalidFields = variantUpdate.mutationList.lineageFilters.keys - validLineageFields.toSet()
                if (invalidFields.isNotEmpty()) {
                    val validFieldsStr = if (validLineageFields.isEmpty()) {
                        "no lineage fields are configured"
                    } else {
                        "valid fields are: ${validLineageFields.joinToString(", ")}"
                    }
                    throw org.genspectrum.dashboardsbackend.controller.BadRequestException(
                        "Invalid lineage fields for organism '${collectionEntity.organism}': " +
                            "${invalidFields.joinToString(", ")}. $validFieldsStr",
                    )
                }

                variantEntity.name = variantUpdate.name
                variantEntity.description = variantUpdate.description
                variantEntity.mutationList = variantUpdate.mutationList
            }
        }
    }
}
