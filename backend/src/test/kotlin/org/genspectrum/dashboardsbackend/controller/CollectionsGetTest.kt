package org.genspectrum.dashboardsbackend.controller

import org.genspectrum.dashboardsbackend.KnownTestOrganisms
import org.genspectrum.dashboardsbackend.api.Variant
import org.genspectrum.dashboardsbackend.dummyCollectionRequest
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
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@SpringBootTest
@AutoConfigureMockMvc
@Import(CollectionsClient::class)
class CollectionsGetTest(
    @param:Autowired private val collectionsClient: CollectionsClient,
    @param:Autowired private val mockMvc: MockMvc,
) {

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
    fun `GIVEN collection with both variant types WHEN getting collections THEN type field is present on variants`() {
        val userId = getNewUserId()
        val createdCollection = collectionsClient.postCollection(dummyCollectionRequest, userId)

        collectionsClient.getCollectionsRaw(userId = userId)
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[0].id").value(createdCollection.id))
            .andExpect(jsonPath("$[0].variants[0].type").value("query"))
            .andExpect(jsonPath("$[0].variants[1].type").value("filterObject"))
    }

    @Test
    fun `GIVEN user has no collections WHEN getting collections for user THEN returns empty array`() {
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
    fun `GIVEN no collections for organism WHEN getting collections for organism THEN returns empty array`() {
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
        assertThat(mutationListVariant.filterObject.aminoAcidMutations, equalTo(listOf("S:N501Y", "S:E484K", "S:K417N")))
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

        assertThat(queryVariants[0].countQuery, notNullValue())
        assertThat(mutationListVariants[0].filterObject, notNullValue())
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
        val nonExistentId = 999999L

        collectionsClient.getCollectionRaw(nonExistentId)
            .andExpect(status().isNotFound)
            .andExpect(jsonPath("$.detail").value("Collection $nonExistentId not found"))
    }

    @Test
    fun `WHEN getting collection with non-numeric ID THEN returns 400`() {
        mockMvc.perform(get("/collections/not-a-number"))
            .andExpect(status().isBadRequest)
    }
}
