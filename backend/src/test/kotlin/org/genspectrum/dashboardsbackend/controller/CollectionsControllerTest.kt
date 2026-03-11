package org.genspectrum.dashboardsbackend.controller

import org.genspectrum.dashboardsbackend.KnownTestOrganisms
import org.genspectrum.dashboardsbackend.api.CollectionRequest
import org.genspectrum.dashboardsbackend.api.Variant
import org.genspectrum.dashboardsbackend.api.VariantRequest
import org.genspectrum.dashboardsbackend.dummyCollectionRequest
import org.genspectrum.dashboardsbackend.dummyMutationListVariantRequest
import org.genspectrum.dashboardsbackend.dummyQueryVariantRequest
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.empty
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.hasItem
import org.hamcrest.Matchers.hasSize
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

@SpringBootTest
@AutoConfigureMockMvc
@Import(CollectionsClient::class)
class CollectionsControllerTest(@param:Autowired private val collectionsClient: CollectionsClient) {

    @Test
    fun `GIVEN I create a collection with variants WHEN getting collection THEN returns collection with variants and generated IDs`() {
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

        val collectionA = collectionsClient.postCollection(dummyCollectionRequest.copy(name = "User A Collection"), userA)
        val collectionB = collectionsClient.postCollection(dummyCollectionRequest.copy(name = "User B Collection"), userB)

        val collectionsForUserA = collectionsClient.getCollections(userId = userA)
        val collectionsForUserB = collectionsClient.getCollections(userId = userB)

        assertThat(collectionsForUserA, hasItem(collectionA))
        assertThat(collectionsForUserA, not(hasItem(collectionB)))

        assertThat(collectionsForUserB, hasItem(collectionB))
        assertThat(collectionsForUserB, not(hasItem(collectionA)))
    }

    @Test
    fun `GIVEN collections for multiple users and organisms WHEN getting all collections THEN returns all collections`() {
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
    fun `GIVEN collections for multiple users and organisms WHEN filtering by userId AND organism THEN returns correct subset`() {
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
        assertThat(mutationListVariant.mutationList, equalTo(listOf("S:N501Y", "S:E484K", "S:K417N")))
    }

    @Test
    fun `GIVEN collection with both variant types WHEN getting collection THEN variant types are correctly discriminated`() {
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
    fun `GIVEN collection created by different user WHEN getting collection by ID THEN returns collection (public access)`() {
        val userA = getNewUserId()
        val createdCollection = collectionsClient.postCollection(dummyCollectionRequest.copy(name = "User A Collection"), userA)

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
}
