package org.genspectrum.dashboardsbackend.model.collection

import org.genspectrum.dashboardsbackend.api.Collection
import org.genspectrum.dashboardsbackend.api.CollectionRequest
import org.genspectrum.dashboardsbackend.api.VariantRequest
import org.genspectrum.dashboardsbackend.config.DashboardsConfig
import org.genspectrum.dashboardsbackend.config.validateIsValidOrganism
import org.genspectrum.dashboardsbackend.controller.NotFoundException
import org.genspectrum.dashboardsbackend.util.convertToUuid
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.and
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
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
}
