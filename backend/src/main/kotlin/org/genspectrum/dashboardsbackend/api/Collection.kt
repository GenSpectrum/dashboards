package org.genspectrum.dashboardsbackend.api

import io.swagger.v3.oas.annotations.media.Schema
import kotlin.time.Instant

@Schema(
    description = "A collection of variants",
    example = """
{
    "id": 1,
    "name": "My Collection",
    "ownedBy": "user123",
    "organism": "covid",
    "description": "A collection of interesting variants",
    "variants": [],
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-02T00:00:00Z"
}
""",
)
data class Collection(
    val id: Long,
    val name: String,
    val ownedBy: String,
    val organism: String,
    val description: String?,
    val variants: List<Variant>,
    val createdAt: Instant,
    val updatedAt: Instant,
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
            "id": 1,
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
