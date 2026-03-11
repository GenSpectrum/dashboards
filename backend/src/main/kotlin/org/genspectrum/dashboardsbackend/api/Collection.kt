package org.genspectrum.dashboardsbackend.api

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import io.swagger.v3.oas.annotations.media.Schema
import org.genspectrum.dashboardsbackend.api.Variant.MutationListVariant
import org.genspectrum.dashboardsbackend.api.Variant.QueryVariant

@Schema(
    description = "A collection of variants",
    example = """
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Collection",
    "ownedBy": "user123",
    "organism": "covid",
    "description": "A collection of interesting variants",
    "variants": []
}
""",
)
data class Collection(
    val id: String,
    val name: String,
    val ownedBy: String,
    val organism: String,
    val description: String?,
    val variants: List<Variant>,
)

@Schema(
    description = "Request to create a collection",
    example = """
{
    "name": "My Collection",
    "organism": "covid",
    "description": "A collection of interesting variants",
    "variants": [
        {
            "type": "query",
            "name": "BA.2 in USA",
            "description": "BA.2 lineage cases in USA",
            "countQuery": "country='USA' & lineage='BA.2'",
            "coverageQuery": "country='USA'"
        }
    ]
}
""",
)
data class CollectionRequest(
    val name: String,
    val organism: String,
    val description: String? = null,
    val variants: List<VariantRequest>,
)

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "type",
)
@JsonSubTypes(
    JsonSubTypes.Type(value = QueryVariant::class, name = "query"),
    JsonSubTypes.Type(value = MutationListVariant::class, name = "mutationList"),
)
@Schema(
    description = "Base interface for different variant types",
)
sealed interface Variant {
    val id: String
    val collectionId: String

    enum class QueryVariantType {
        @JsonProperty("query")
        QUERY,
    }

    enum class MutationListVariantType {
        @JsonProperty("mutationList")
        MUTATION_LIST,
    }

    @Schema(
        description = "A variant defined by LAPIS queries",
        example = """
{
    "type": "query",
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "collectionId": "660e8400-e29b-41d4-a716-446655440000",
    "name": "BA.2 in USA",
    "description": "BA.2 lineage cases in USA",
    "countQuery": "country='USA' & lineage='BA.2'",
    "coverageQuery": "country='USA'"
}
""",
    )
    data class QueryVariant @JsonCreator constructor(
        override val id: String,
        override val collectionId: String,
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
    "type": "mutationList",
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "collectionId": "660e8400-e29b-41d4-a716-446655440000",
    "name": "Omicron mutations",
    "description": "Key mutations for Omicron",
    "mutationList": ["S:N501Y", "S:E484K", "S:K417N"]
}
""",
    )
    data class MutationListVariant @JsonCreator constructor(
        override val id: String,
        override val collectionId: String,
        val name: String,
        val description: String?,
        val mutationList: List<String>,
    ) : Variant {
        val type: MutationListVariantType = MutationListVariantType.MUTATION_LIST
    }
}

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "type",
)
@JsonSubTypes(
    JsonSubTypes.Type(value = VariantRequest.QueryVariantRequest::class, name = "query"),
    JsonSubTypes.Type(value = VariantRequest.MutationListVariantRequest::class, name = "mutationList"),
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
    ) : VariantRequest

    @Schema(
        description = "Request to create a mutation list variant",
        example = """
{
    "type": "mutationList",
    "name": "Omicron mutations",
    "description": "Key mutations for Omicron",
    "mutationList": ["S:N501Y", "S:E484K", "S:K417N"]
}
""",
    )
    data class MutationListVariantRequest(
        val name: String,
        val description: String? = null,
        val mutationList: List<String>,
    ) : VariantRequest
}
