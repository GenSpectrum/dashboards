package org.genspectrum.dashboardsbackend.controller

import org.genspectrum.dashboardsbackend.KnownTestOrganisms
import org.genspectrum.dashboardsbackend.api.CollectionUpdate
import org.genspectrum.dashboardsbackend.api.MutationListDefinition
import org.genspectrum.dashboardsbackend.api.Variant
import org.genspectrum.dashboardsbackend.api.VariantRequest
import org.genspectrum.dashboardsbackend.api.VariantUpdate
import org.genspectrum.dashboardsbackend.dummyCollectionRequest
import org.genspectrum.dashboardsbackend.dummyMutationListVariantRequest
import org.genspectrum.dashboardsbackend.dummyQueryVariantRequest
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.empty
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.hasItem
import org.hamcrest.Matchers.hasSize
import org.hamcrest.Matchers.instanceOf
import org.hamcrest.Matchers.not
import org.hamcrest.Matchers.notNullValue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.content
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@Import(CollectionsClient::class)
class CollectionsControllerTest(@param:Autowired private val collectionsClient: CollectionsClient) {

    @Test
    fun `GIVEN collection with variants WHEN creating THEN returns with generated IDs`() {
        val userId = getNewUserId()
        val createdCollection = collectionsClient.postCollection(dummyCollectionRequest, userId)

        assertThat(createdCollection.id, notNullValue())
        assertThat(createdCollection.name, equalTo(dummyCollectionRequest.name))
        assertThat(createdCollection.ownedBy, equalTo(userId))
        assertThat(createdCollection.organism, equalTo(dummyCollectionRequest.organism))
        assertThat(createdCollection.description, equalTo(dummyCollectionRequest.description))
        assertThat(createdCollection.variants, hasSize(2))
        assertThat(createdCollection.variants[0].id, notNullValue())
        assertThat(createdCollection.variants[1].id, notNullValue())
    }

    @Test
    fun `WHEN creating collection with only query variants THEN succeeds`() {
        val userId = getNewUserId()
        val request = dummyCollectionRequest.copy(
            variants = listOf(dummyQueryVariantRequest),
        )

        val createdCollection = collectionsClient.postCollection(request, userId)

        assertThat(createdCollection.variants, hasSize(1))
        assertThat(createdCollection.variants[0], org.hamcrest.Matchers.instanceOf(Variant.QueryVariant::class.java))
    }

    @Test
    fun `WHEN creating collection with only mutation list variants THEN succeeds`() {
        val userId = getNewUserId()
        val request = dummyCollectionRequest.copy(
            variants = listOf(dummyMutationListVariantRequest),
        )

        val createdCollection = collectionsClient.postCollection(request, userId)

        assertThat(createdCollection.variants, hasSize(1))
        assertThat(
            createdCollection.variants[0],
            org.hamcrest.Matchers.instanceOf(Variant.MutationListVariant::class.java),
        )
    }

    @Test
    fun `WHEN creating collection with no variants THEN succeeds`() {
        val userId = getNewUserId()
        val request = dummyCollectionRequest.copy(variants = emptyList())

        val createdCollection = collectionsClient.postCollection(request, userId)

        assertThat(createdCollection.variants, empty())
    }

    @Test
    fun `WHEN creating collection with unknown organism THEN returns 400`() {
        val userId = getNewUserId()
        collectionsClient.postCollectionRaw(dummyCollectionRequest.copy(organism = "unknown organism"), userId)
            .andExpect(status().isBadRequest)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("\$.detail").value("Organism 'unknown organism' is not supported"))
    }

    @Test
    fun `GIVEN collections for multiple users WHEN getting collections THEN users get separate collections`() {
        val userA = getNewUserId()
        val userB = getNewUserId()

        val collectionA = collectionsClient.postCollection(
            dummyCollectionRequest.copy(name = "User A Collection"),
            userA,
        )
        val collectionB = collectionsClient.postCollection(
            dummyCollectionRequest.copy(name = "User B Collection"),
            userB,
        )

        val collectionsForUserA = collectionsClient.getCollections(userId = userA)
        val collectionsForUserB = collectionsClient.getCollections(userId = userB)

        assertThat(collectionsForUserA, hasItem(collectionA))
        assertThat(collectionsForUserA, not(hasItem(collectionB)))

        assertThat(collectionsForUserB, hasItem(collectionB))
        assertThat(collectionsForUserB, not(hasItem(collectionA)))
    }

    @Test
    fun `GIVEN multiple collections WHEN getting all THEN returns all`() {
        val userA = getNewUserId()
        val userB = getNewUserId()

        val covidCollectionA = collectionsClient.postCollection(
            dummyCollectionRequest.copy(name = "Covid A", organism = KnownTestOrganisms.Covid.name),
            userA,
        )
        val mpoxCollectionA = collectionsClient.postCollection(
            dummyCollectionRequest.copy(name = "Mpox A", organism = KnownTestOrganisms.Mpox.name),
            userA,
        )
        val covidCollectionB = collectionsClient.postCollection(
            dummyCollectionRequest.copy(name = "Covid B", organism = KnownTestOrganisms.Covid.name),
            userB,
        )

        val allCollections = collectionsClient.getCollections()

        assertThat(allCollections, hasItem(covidCollectionA))
        assertThat(allCollections, hasItem(mpoxCollectionA))
        assertThat(allCollections, hasItem(covidCollectionB))
    }

    @Test
    fun `GIVEN collections for multiple users WHEN getting by userId THEN returns only that user's collections`() {
        val userA = getNewUserId()
        val userB = getNewUserId()

        val collectionA = collectionsClient.postCollection(dummyCollectionRequest.copy(name = "User A"), userA)
        val collectionB = collectionsClient.postCollection(dummyCollectionRequest.copy(name = "User B"), userB)

        val collectionsForUserA = collectionsClient.getCollections(userId = userA)

        assertThat(collectionsForUserA, hasItem(collectionA))
        assertThat(collectionsForUserA, not(hasItem(collectionB)))
    }

    @Test
    fun `WHEN getting collections for user with no collections THEN returns empty array`() {
        val nonexistentUserId = getNewUserId()

        val collections = collectionsClient.getCollections(userId = nonexistentUserId)

        assertThat(collections, empty())
    }

    @Test
    fun `GIVEN covid and mpox collections WHEN getting by organism THEN returns only that organism's collections`() {
        val userId = getNewUserId()

        val covidCollection = collectionsClient.postCollection(
            dummyCollectionRequest.copy(name = "Covid", organism = KnownTestOrganisms.Covid.name),
            userId,
        )
        val mpoxCollection = collectionsClient.postCollection(
            dummyCollectionRequest.copy(name = "Mpox", organism = KnownTestOrganisms.Mpox.name),
            userId,
        )

        val covidCollections = collectionsClient.getCollections(organism = KnownTestOrganisms.Covid.name)

        assertThat(covidCollections, hasItem(covidCollection))
        assertThat(covidCollections, not(hasItem(mpoxCollection)))
    }

    @Test
    fun `WHEN getting collections for organism with no collections THEN returns empty array`() {
        val collections = collectionsClient.getCollections(organism = KnownTestOrganisms.WestNile.name)

        assertThat(collections, empty())
    }

    @Test
    fun `GIVEN multiple collections WHEN filtering by userId AND organism THEN returns subset`() {
        val userA = getNewUserId()
        val userB = getNewUserId()

        val covidCollectionA = collectionsClient.postCollection(
            dummyCollectionRequest.copy(name = "Covid A", organism = KnownTestOrganisms.Covid.name),
            userA,
        )
        val mpoxCollectionA = collectionsClient.postCollection(
            dummyCollectionRequest.copy(name = "Mpox A", organism = KnownTestOrganisms.Mpox.name),
            userA,
        )
        val covidCollectionB = collectionsClient.postCollection(
            dummyCollectionRequest.copy(name = "Covid B", organism = KnownTestOrganisms.Covid.name),
            userB,
        )

        val filteredCollections = collectionsClient.getCollections(
            userId = userA,
            organism = KnownTestOrganisms.Covid.name,
        )

        assertThat(filteredCollections, hasItem(covidCollectionA))
        assertThat(filteredCollections, not(hasItem(mpoxCollectionA)))
        assertThat(filteredCollections, not(hasItem(covidCollectionB)))
    }

    @Test
    fun `GIVEN collections WHEN filtering by userId and organism with no matches THEN returns empty array`() {
        val userA = getNewUserId()
        collectionsClient.postCollection(
            dummyCollectionRequest.copy(organism = KnownTestOrganisms.Covid.name),
            userA,
        )

        val collections = collectionsClient.getCollections(userId = userA, organism = KnownTestOrganisms.Mpox.name)

        assertThat(collections, empty())
    }

    @Test
    fun `GIVEN collection with variants WHEN getting collection THEN all variant fields are present`() {
        val userId = getNewUserId()
        val createdCollection = collectionsClient.postCollection(dummyCollectionRequest, userId)

        val collections = collectionsClient.getCollections(userId = userId)
        val retrievedCollection = collections.first { it.id == createdCollection.id }

        assertThat(retrievedCollection.variants, hasSize(2))

        val queryVariant = retrievedCollection.variants.first { it is Variant.QueryVariant } as Variant.QueryVariant
        assertThat(queryVariant.name, equalTo("BA.2 in USA"))
        assertThat(queryVariant.description, equalTo("BA.2 lineage cases in USA"))
        assertThat(queryVariant.countQuery, equalTo("country='USA' & lineage='BA.2'"))
        assertThat(queryVariant.coverageQuery, equalTo("country='USA'"))

        val mutationListVariant =
            retrievedCollection.variants.first { it is Variant.MutationListVariant } as Variant.MutationListVariant
        assertThat(mutationListVariant.name, equalTo("Omicron mutations"))
        assertThat(mutationListVariant.description, equalTo("Key mutations"))
        assertThat(mutationListVariant.mutationList.aaMutations, equalTo(listOf("S:N501Y", "S:E484K", "S:K417N")))
    }

    @Test
    fun `GIVEN both variant types WHEN getting collection THEN types are discriminated`() {
        val userId = getNewUserId()
        val createdCollection = collectionsClient.postCollection(dummyCollectionRequest, userId)

        val collections = collectionsClient.getCollections(userId = userId)
        val retrievedCollection = collections.first { it.id == createdCollection.id }

        val queryVariants = retrievedCollection.variants.filterIsInstance<Variant.QueryVariant>()
        val mutationListVariants = retrievedCollection.variants.filterIsInstance<Variant.MutationListVariant>()

        assertThat(queryVariants, hasSize(1))
        assertThat(mutationListVariants, hasSize(1))

        // Verify QueryVariant has query fields
        assertThat(queryVariants[0].countQuery, notNullValue())

        // Verify MutationListVariant has mutationList field
        assertThat(mutationListVariants[0].mutationList, notNullValue())
    }

    @Test
    fun `GIVEN collection exists WHEN getting collection by ID THEN returns collection with all fields and variants`() {
        val userId = getNewUserId()
        val createdCollection = collectionsClient.postCollection(dummyCollectionRequest, userId)

        val retrievedCollection = collectionsClient.getCollection(createdCollection.id)

        assertThat(retrievedCollection.id, equalTo(createdCollection.id))
        assertThat(retrievedCollection.name, equalTo(dummyCollectionRequest.name))
        assertThat(retrievedCollection.ownedBy, equalTo(userId))
        assertThat(retrievedCollection.organism, equalTo(dummyCollectionRequest.organism))
        assertThat(retrievedCollection.description, equalTo(dummyCollectionRequest.description))
        assertThat(retrievedCollection.variants, hasSize(2))
    }

    @Test
    fun `GIVEN different user's collection WHEN getting by ID THEN returns (public access)`() {
        val userA = getNewUserId()
        val createdCollection = collectionsClient.postCollection(
            dummyCollectionRequest.copy(name = "User A Collection"),
            userA,
        )

        val retrievedCollection = collectionsClient.getCollection(createdCollection.id)

        assertThat(retrievedCollection.id, equalTo(createdCollection.id))
        assertThat(retrievedCollection.ownedBy, equalTo(userA))
    }

    @Test
    fun `WHEN getting collection with non-existent ID THEN returns 404`() {
        val nonExistentId = "00000000-0000-0000-0000-000000000000"

        collectionsClient.getCollectionRaw(nonExistentId)
            .andExpect(status().isNotFound)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.detail").value("Collection $nonExistentId not found"))
    }

    @Test
    fun `WHEN getting collection with invalid UUID format THEN returns 400`() {
        val invalidId = "not-a-uuid"

        collectionsClient.getCollectionRaw(invalidId)
            .andExpect(status().isBadRequest)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.detail").value("Invalid UUID $invalidId"))
    }

    // MutationListDefinition Tests

    @Test
    fun `WHEN creating variant with lineage filter THEN succeeds`() {
        val userId = getNewUserId()
        val variantWithLineage = VariantRequest.MutationListVariantRequest(
            name = "BA.2 lineage",
            description = "BA.2 variant",
            mutationList = org.genspectrum.dashboardsbackend.api.MutationListDefinition.create(
                aaMutations = listOf("S:N501Y"),
                lineageFilters = mapOf("pangoLineage" to "BA.2*"),
            ),
        )
        val request = dummyCollectionRequest.copy(variants = listOf(variantWithLineage))

        val createdCollection = collectionsClient.postCollection(request, userId)

        assertThat(createdCollection.variants, hasSize(1))
        val variant = createdCollection.variants[0] as Variant.MutationListVariant
        assertThat(variant.mutationList.aaMutations, equalTo(listOf("S:N501Y")))
        assertThat(variant.mutationList.lineageFilters["pangoLineage"], equalTo("BA.2*"))
    }

    @Test
    fun `WHEN creating variant with invalid lineage field THEN returns 400`() {
        val userId = getNewUserId()
        val variantWithInvalidLineage = VariantRequest.MutationListVariantRequest(
            name = "Invalid lineage",
            description = "Has invalid lineage field",
            mutationList = org.genspectrum.dashboardsbackend.api.MutationListDefinition.create(
                aaMutations = emptyList(),
                lineageFilters = mapOf("invalidLineageField" to "value"),
            ),
        )
        val request = dummyCollectionRequest.copy(variants = listOf(variantWithInvalidLineage))

        collectionsClient.postCollectionRaw(request, userId)
            .andExpect(status().isBadRequest)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(
                jsonPath("$.detail").value(
                    org.hamcrest.Matchers.containsString("Invalid lineage fields for organism 'Covid'"),
                ),
            )
            .andExpect(
                jsonPath("$.detail").value(
                    org.hamcrest.Matchers.containsString("invalidLineageField"),
                ),
            )
    }

    @Test
    fun `WHEN creating variant with multiple lineage filters THEN succeeds`() {
        val userId = getNewUserId()
        val variantWithMultipleLineages = VariantRequest.MutationListVariantRequest(
            name = "Multiple lineages",
            description = "Has multiple lineage filters",
            mutationList = org.genspectrum.dashboardsbackend.api.MutationListDefinition.create(
                aaMutations = listOf("S:K417N"),
                lineageFilters = mapOf(
                    "pangoLineage" to "BA.2*",
                    "nextcladePangoLineage" to "BA.2.75*",
                ),
            ),
        )
        val request = dummyCollectionRequest.copy(variants = listOf(variantWithMultipleLineages))

        val createdCollection = collectionsClient.postCollection(request, userId)

        val variant = createdCollection.variants[0] as Variant.MutationListVariant
        assertThat(variant.mutationList.lineageFilters["pangoLineage"], equalTo("BA.2*"))
        assertThat(variant.mutationList.lineageFilters["nextcladePangoLineage"], equalTo("BA.2.75*"))
    }

    @Test
    fun `WHEN creating variant with only aaMutations THEN succeeds`() {
        val userId = getNewUserId()
        val variantWithOnlyAaMutations = VariantRequest.MutationListVariantRequest(
            name = "Only AA mutations",
            description = "Only has amino acid mutations",
            mutationList = org.genspectrum.dashboardsbackend.api.MutationListDefinition(
                aaMutations = listOf("S:N501Y", "S:E484K"),
            ),
        )
        val request = dummyCollectionRequest.copy(variants = listOf(variantWithOnlyAaMutations))

        val createdCollection = collectionsClient.postCollection(request, userId)

        val variant = createdCollection.variants[0] as Variant.MutationListVariant
        assertThat(variant.mutationList.aaMutations, equalTo(listOf("S:N501Y", "S:E484K")))
        assertThat(variant.mutationList.nucMutations, org.hamcrest.Matchers.nullValue())
    }

    @Test
    fun `WHEN creating variant with insertions THEN succeeds`() {
        val userId = getNewUserId()
        val variantWithInsertions = VariantRequest.MutationListVariantRequest(
            name = "With insertions",
            description = "Has insertions",
            mutationList = org.genspectrum.dashboardsbackend.api.MutationListDefinition(
                aaMutations = listOf("S:N501Y"),
                aaInsertions = listOf("ins_S:214:EPE"),
                nucInsertions = listOf("ins_22204:GAG"),
            ),
        )
        val request = dummyCollectionRequest.copy(variants = listOf(variantWithInsertions))

        val createdCollection = collectionsClient.postCollection(request, userId)

        val variant = createdCollection.variants[0] as Variant.MutationListVariant
        assertThat(variant.mutationList.aaInsertions, equalTo(listOf("ins_S:214:EPE")))
        assertThat(variant.mutationList.nucInsertions, equalTo(listOf("ins_22204:GAG")))
    }

    @Test
    fun `WHEN owner deletes collection THEN succeeds and collection is removed`() {
        val userId = getNewUserId()
        val createdCollection = collectionsClient.postCollection(dummyCollectionRequest, userId)

        collectionsClient.deleteCollection(createdCollection.id, userId)

        collectionsClient.getCollectionRaw(createdCollection.id)
            .andExpect(status().isNotFound)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.detail").value("Collection ${createdCollection.id} not found"))
    }

    @Test
    fun `WHEN non-owner deletes collection THEN returns 403 forbidden`() {
        val owner = getNewUserId()
        val nonOwner = getNewUserId()
        val createdCollection = collectionsClient.postCollection(dummyCollectionRequest, owner)

        collectionsClient.deleteCollectionRaw(createdCollection.id, nonOwner)
            .andExpect(status().isForbidden)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(
                jsonPath("$.detail").value(
                    org.hamcrest.Matchers.containsString("you don't have permission to delete it"),
                ),
            )
    }

    @Test
    fun `WHEN deleting non-existent collection THEN returns 403`() {
        val userId = getNewUserId()
        val nonExistentId = UUID.randomUUID().toString()

        collectionsClient.deleteCollectionRaw(nonExistentId, userId)
            .andExpect(status().isForbidden)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(
                jsonPath("$.detail").value(
                    org.hamcrest.Matchers.containsString("not found or you don't have permission"),
                ),
            )
    }

    @Test
    fun `WHEN owner updates all fields THEN collection is updated`() {
        val userId = getNewUserId()
        val createdCollection = collectionsClient.postCollection(dummyCollectionRequest, userId)

        val updatedVariants = listOf(
            VariantUpdate.QueryVariantUpdate(
                name = "New Variant",
                description = "New description",
                countQuery = "country='USA'",
                coverageQuery = "country='USA'",
            ),
        )

        val update = CollectionUpdate(
            name = "Updated Name",
            description = "Updated Description",
            variants = updatedVariants,
        )

        val updated = collectionsClient.putCollection(update, createdCollection.id, userId)

        assertThat(updated.name, equalTo("Updated Name"))
        assertThat(updated.description, equalTo("Updated Description"))
        assertThat(updated.variants.size, equalTo(1))
        val firstVariant = updated.variants[0] as Variant.QueryVariant
        assertThat(firstVariant.name, equalTo("New Variant"))
    }

    @Test
    fun `WHEN owner updates only name THEN only name changes`() {
        val userId = getNewUserId()
        val createdCollection = collectionsClient.postCollection(dummyCollectionRequest, userId)
        val originalVariantCount = createdCollection.variants.size

        val update = CollectionUpdate(name = "Just Name Change")

        val updated = collectionsClient.putCollection(update, createdCollection.id, userId)

        assertThat(updated.name, equalTo("Just Name Change"))
        assertThat(updated.description, equalTo(createdCollection.description))
        assertThat(updated.variants.size, equalTo(originalVariantCount))
    }

    @Test
    fun `WHEN owner sends empty update THEN nothing changes`() {
        val userId = getNewUserId()
        val createdCollection = collectionsClient.postCollection(dummyCollectionRequest, userId)

        val update = CollectionUpdate()

        val updated = collectionsClient.putCollection(update, createdCollection.id, userId)

        assertThat(updated, equalTo(createdCollection))
    }

    @Test
    fun `WHEN owner adds new variant without ID THEN variant is created`() {
        val userId = getNewUserId()
        val createdCollection = collectionsClient.postCollection(dummyCollectionRequest, userId)
        val originalVariantCount = createdCollection.variants.size

        val newVariant = VariantUpdate.MutationListVariantUpdate(
            id = null,
            name = "New Variant",
            mutationList = MutationListDefinition(
                aaMutations = listOf("S:N501Y"),
            ),
        )

        val existingVariants = createdCollection.variants.map { variant ->
            when (variant) {
                is Variant.QueryVariant -> VariantUpdate.QueryVariantUpdate(
                    id = variant.id,
                    name = variant.name,
                    description = variant.description,
                    countQuery = variant.countQuery,
                    coverageQuery = variant.coverageQuery,
                )
                is Variant.MutationListVariant -> VariantUpdate.MutationListVariantUpdate(
                    id = variant.id,
                    name = variant.name,
                    description = variant.description,
                    mutationList = variant.mutationList,
                )
            }
        }

        val update = CollectionUpdate(variants = existingVariants + newVariant)

        val updated = collectionsClient.putCollection(update, createdCollection.id, userId)

        assertThat(updated.variants.size, equalTo(originalVariantCount + 1))
        assertThat(
            updated.variants.any { variant ->
                when (variant) {
                    is Variant.QueryVariant -> variant.name == "New Variant"
                    is Variant.MutationListVariant -> variant.name == "New Variant"
                }
            },
            equalTo(true),
        )
    }

    @Test
    fun `WHEN non-owner updates collection THEN returns 403 forbidden`() {
        val owner = getNewUserId()
        val nonOwner = getNewUserId()
        val createdCollection = collectionsClient.postCollection(dummyCollectionRequest, owner)

        collectionsClient.putCollectionRaw(
            CollectionUpdate(name = "Hacked Name"),
            createdCollection.id,
            nonOwner,
        )
            .andExpect(status().isForbidden)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(
                jsonPath("$.detail").value(
                    org.hamcrest.Matchers.containsString("you don't have permission to update it"),
                ),
            )
    }

    @Test
    fun `WHEN owner updates existing variant with ID THEN variant is updated in place`() {
        val userId = getNewUserId()
        val createdCollection = collectionsClient.postCollection(dummyCollectionRequest, userId)
        val firstVariant = createdCollection.variants[0] as Variant.QueryVariant

        val updatedVariant = VariantUpdate.QueryVariantUpdate(
            id = firstVariant.id,
            name = "Updated Name",
            description = "Updated Description",
            countQuery = "country='France'",
            coverageQuery = "country='France'",
        )

        val update = CollectionUpdate(variants = listOf(updatedVariant))

        val updated = collectionsClient.putCollection(update, createdCollection.id, userId)

        assertThat(updated.variants.size, equalTo(1))
        assertThat(updated.variants[0].id, equalTo(firstVariant.id))
        val queryVariant = updated.variants[0] as Variant.QueryVariant
        assertThat(queryVariant.name, equalTo("Updated Name"))
        assertThat(queryVariant.countQuery, equalTo("country='France'"))
    }

    @Test
    fun `WHEN owner omits variant from update THEN variant is deleted`() {
        val userId = getNewUserId()
        val originalVariants = listOf(
            VariantRequest.QueryVariantRequest(
                name = "Variant 1",
                countQuery = "country='USA'",
            ),
            VariantRequest.QueryVariantRequest(
                name = "Variant 2",
                countQuery = "country='Germany'",
            ),
        )
        val collectionRequest = dummyCollectionRequest.copy(variants = originalVariants)
        val createdCollection = collectionsClient.postCollection(collectionRequest, userId)

        val firstVariant = createdCollection.variants[0]
        val keepVariant = VariantUpdate.QueryVariantUpdate(
            id = firstVariant.id,
            name = (firstVariant as Variant.QueryVariant).name,
            countQuery = firstVariant.countQuery,
        )

        val update = CollectionUpdate(variants = listOf(keepVariant))

        val updated = collectionsClient.putCollection(update, createdCollection.id, userId)

        assertThat(updated.variants.size, equalTo(1))
        assertThat(updated.variants[0].id, equalTo(firstVariant.id))
    }

    @Test
    fun `WHEN updating with invalid lineage fields THEN returns 400`() {
        val userId = getNewUserId()
        val createdCollection = collectionsClient.postCollection(dummyCollectionRequest, userId)

        val invalidVariant = VariantUpdate.MutationListVariantUpdate(
            name = "Invalid Variant",
            mutationList = MutationListDefinition.create(
                aaMutations = listOf("S:N501Y"),
                lineageFilters = mapOf("invalidField" to "value"),
            ),
        )

        val update = CollectionUpdate(variants = listOf(invalidVariant))

        collectionsClient.putCollectionRaw(update, createdCollection.id, userId)
            .andExpect(status().isBadRequest)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("Invalid lineage fields")))
    }

    @Test
    fun `WHEN updating variant type THEN returns 400`() {
        val userId = getNewUserId()
        val createdCollection = collectionsClient.postCollection(dummyCollectionRequest, userId)
        val firstVariant = createdCollection.variants[0] as Variant.QueryVariant

        val invalidUpdate = VariantUpdate.MutationListVariantUpdate(
            id = firstVariant.id,
            name = "Changed Type",
            mutationList = MutationListDefinition(
                aaMutations = listOf("S:N501Y"),
            ),
        )

        val update = CollectionUpdate(variants = listOf(invalidUpdate))

        collectionsClient.putCollectionRaw(update, createdCollection.id, userId)
            .andExpect(status().isBadRequest)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("Cannot change variant type")))
    }

    @Test
    fun `WHEN updating with variant ID from different collection THEN returns 400`() {
        val userId = getNewUserId()
        val collection1 = collectionsClient.postCollection(dummyCollectionRequest, userId)
        val collection2 = collectionsClient.postCollection(
            dummyCollectionRequest.copy(name = "Collection 2"),
            userId,
        )

        val variantFromCollection2 = collection2.variants[0] as Variant.QueryVariant
        val invalidUpdate = VariantUpdate.QueryVariantUpdate(
            id = variantFromCollection2.id,
            name = variantFromCollection2.name,
            countQuery = variantFromCollection2.countQuery,
        )

        val update = CollectionUpdate(variants = listOf(invalidUpdate))

        collectionsClient.putCollectionRaw(update, collection1.id, userId)
            .andExpect(status().isBadRequest)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(
                jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("does not belong to collection")),
            )
    }
}
