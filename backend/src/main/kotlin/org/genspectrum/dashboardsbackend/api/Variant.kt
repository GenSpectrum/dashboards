package org.genspectrum.dashboardsbackend.api

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import io.swagger.v3.oas.annotations.media.Schema
import org.genspectrum.dashboardsbackend.api.Variant.FilterObjectVariant
import org.genspectrum.dashboardsbackend.api.Variant.QueryVariant

enum class QueryVariantType {
    @JsonProperty("query")
    QUERY,
}

enum class FilterObjectVariantType {
    @JsonProperty("filterObject")
    FILTER_OBJECT,
}

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "type",
)
@JsonSubTypes(
    JsonSubTypes.Type(value = QueryVariant::class, name = "query"),
    JsonSubTypes.Type(value = FilterObjectVariant::class, name = "filterObject"),
)
@Schema(
    description = "Base interface for different variant types",
)
sealed interface Variant {
    val id: Long
    val collectionId: Long

    @Schema(
        description = "A variant defined by LAPIS queries",
        example = """
{
    "type": "query",
    "id": 1,
    "collectionId": 2,
    "name": "BA.2 in USA",
    "description": "BA.2 lineage cases in USA",
    "countQuery": "country='USA' & lineage='BA.2'",
    "coverageQuery": "country='USA'"
}
""",
    )
    data class QueryVariant @JsonCreator constructor(
        override val id: Long,
        override val collectionId: Long,
        val name: String,
        val description: String?,
        val countQuery: String,
        val coverageQuery: String? = null,
    ) : Variant {
        val type: QueryVariantType = QueryVariantType.QUERY
    }

    @Schema(
        description = "A variant defined by a list of mutations",
        example = """
{
    "type": "filterObject",
    "id": 1,
    "collectionId": 2,
    "name": "Omicron mutations",
    "description": "Key mutations for Omicron",
    "filterObject": {
        "aminoAcidMutations": ["S:N501Y", "S:E484K", "S:K417N"]
    }
}
""",
    )
    data class FilterObjectVariant @JsonCreator constructor(
        override val id: Long,
        override val collectionId: Long,
        val name: String,
        val description: String?,
        val filterObject: FilterObject,
    ) : Variant {
        val type: FilterObjectVariantType = FilterObjectVariantType.FILTER_OBJECT
    }
}

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "type",
)
@JsonSubTypes(
    JsonSubTypes.Type(value = VariantRequest.QueryVariantRequest::class, name = "query"),
    JsonSubTypes.Type(value = VariantRequest.FilterObjectVariantRequest::class, name = "filterObject"),
)
@Schema(
    description = "Request to create a variant",
)
sealed interface VariantRequest {
    @Schema(
        description = "Request to create a query variant",
        example = """
{
    "type": "query",
    "name": "BA.2 in USA",
    "description": "BA.2 lineage cases in USA",
    "countQuery": "country='USA' & lineage='BA.2'",
    "coverageQuery": "country='USA'"
}
""",
    )
    data class QueryVariantRequest(
        val name: String,
        val description: String? = null,
        val countQuery: String,
        val coverageQuery: String? = null,
    ) : VariantRequest {
        val type: QueryVariantType = QueryVariantType.QUERY
    }

    @Schema(
        description = "Request to create a mutation list variant",
        example = """
{
    "type": "filterObject",
    "name": "Omicron mutations",
    "description": "Key mutations for Omicron",
    "filterObject": {
        "aminoAcidMutations": ["S:N501Y", "S:E484K", "S:K417N"]
    }
}
""",
    )
    data class FilterObjectVariantRequest(
        val name: String,
        val description: String? = null,
        val filterObject: FilterObject,
    ) : VariantRequest {
        val type: FilterObjectVariantType = FilterObjectVariantType.FILTER_OBJECT
    }
}

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "type",
)
@JsonSubTypes(
    JsonSubTypes.Type(value = VariantUpdate.QueryVariantUpdate::class, name = "query"),
    JsonSubTypes.Type(value = VariantUpdate.FilterObjectVariantUpdate::class, name = "filterObject"),
)
@Schema(
    description = "Request to update or create a variant",
)
sealed interface VariantUpdate {
    val id: Long?

    @Schema(
        description = "Request to update or create a query variant",
        example = """
{
    "type": "query",
    "id": 1,
    "name": "BA.2 in USA",
    "description": "BA.2 lineage cases in USA",
    "countQuery": "country='USA' & lineage='BA.2'",
    "coverageQuery": "country='USA'"
}
""",
    )
    data class QueryVariantUpdate(
        override val id: Long? = null,
        val name: String,
        val description: String? = null,
        val countQuery: String,
        val coverageQuery: String? = null,
    ) : VariantUpdate {
        val type: QueryVariantType = QueryVariantType.QUERY
    }

    @Schema(
        description = "Request to update or create a mutation list variant",
        example = """
{
    "type": "filterObject",
    "id": 1,
    "name": "Omicron mutations",
    "description": "Key mutations for Omicron",
    "filterObject": {
        "aminoAcidMutations": ["S:N501Y", "S:E484K", "S:K417N"]
    }
}
""",
    )
    data class FilterObjectVariantUpdate(
        override val id: Long? = null,
        val name: String,
        val description: String? = null,
        val filterObject: FilterObject,
    ) : VariantUpdate {
        val type: FilterObjectVariantType = FilterObjectVariantType.FILTER_OBJECT
    }

    fun toVariantRequest(): VariantRequest {
        require(id == null) { "Cannot convert a VariantUpdate with an existing id to a VariantRequest: $id" }
        return when (this) {
            is QueryVariantUpdate -> VariantRequest.QueryVariantRequest(
                name = name,
                description = description,
                countQuery = countQuery,
                coverageQuery = coverageQuery,
            )

            is FilterObjectVariantUpdate -> VariantRequest.FilterObjectVariantRequest(
                name = name,
                description = description,
                filterObject = filterObject,
            )
        }
    }
}
