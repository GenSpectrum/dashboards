package org.genspectrum.dashboardsbackend.api

import io.swagger.v3.oas.annotations.media.Schema

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

@Schema(
    description = "Request to update a collection",
    example = """
{
    "name": "Updated Collection Name",
    "description": "Updated description",
    "variants": [
        {
            "type": "query",
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "BA.2 in USA",
            "description": "BA.2 lineage cases in USA",
            "countQuery": "country='USA' & lineage='BA.2'",
            "coverageQuery": "country='USA'"
        },
        {
            "type": "query",
            "name": "New Variant Without ID",
            "countQuery": "country='Germany'"
        }
    ]
}
""",
)
data class CollectionUpdate(
    val name: String? = null,
    val description: String? = null,
    val variants: List<VariantUpdate>? = null,
)
