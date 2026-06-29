package org.genspectrum.dashboardsbackend.controller

import org.genspectrum.dashboardsbackend.api.CollectionUpdate
import org.genspectrum.dashboardsbackend.dummyCollectionRequest
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.contains
import org.hamcrest.Matchers.containsInAnyOrder
import org.hamcrest.Matchers.empty
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.hasItem
import org.hamcrest.Matchers.not
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@SpringBootTest
@AutoConfigureMockMvc
@Import(CollectionsClient::class, UsersClient::class)
class CollectionsTagsTest(
    @param:Autowired private val collectionsClient: CollectionsClient,
    @param:Autowired private val usersClient: UsersClient,
) {

    @Test
    fun `WHEN creating collection with tags THEN tags are returned`() {
        val userId = usersClient.createUser()
        val collection = collectionsClient.postCollection(
            dummyCollectionRequest.copy(tags = listOf("europe", "flu")),
            userId,
        )

        assertThat(collection.tags, containsInAnyOrder("europe", "flu"))
    }

    @Test
    fun `WHEN creating collection without tags THEN empty tags list is returned`() {
        val userId = usersClient.createUser()
        val collection = collectionsClient.postCollection(dummyCollectionRequest, userId)

        assertThat(collection.tags, empty())
    }

    @Test
    fun `WHEN creating collection with tags THEN tags are lowercased`() {
        val userId = usersClient.createUser()
        val collection = collectionsClient.postCollection(
            dummyCollectionRequest.copy(tags = listOf("Europe", "FLU")),
            userId,
        )

        assertThat(collection.tags, containsInAnyOrder("europe", "flu"))
    }

    @Test
    fun `WHEN getting collection by ID THEN tags are included`() {
        val userId = usersClient.createUser()
        val created = collectionsClient.postCollection(
            dummyCollectionRequest.copy(tags = listOf("flu")),
            userId,
        )

        val retrieved = collectionsClient.getCollection(created.id)

        assertThat(retrieved.tags, contains("flu"))
    }

    @Test
    fun `WHEN getting collections THEN tags are included`() {
        val userId = usersClient.createUser()
        collectionsClient.postCollection(
            dummyCollectionRequest.copy(tags = listOf("europe", "flu")),
            userId,
        )

        val collections = collectionsClient.getCollections(userId = userId)

        assertThat(collections.first().tags, containsInAnyOrder("europe", "flu"))
    }

    @Test
    fun `GIVEN collections with different tags WHEN filtering by one tag THEN returns matching collections only`() {
        val userId = usersClient.createUser()
        val fluCollection = collectionsClient.postCollection(
            dummyCollectionRequest.copy(name = "Flu", tags = listOf("flu")),
            userId,
        )
        val covidCollection = collectionsClient.postCollection(
            dummyCollectionRequest.copy(name = "Covid", tags = listOf("covid")),
            userId,
        )

        val results = collectionsClient.getCollections(userId = userId, tags = listOf("flu"), includeVariants = true)

        assertThat(results, hasItem(fluCollection))
        assertThat(results, not(hasItem(covidCollection)))
    }

    @Test
    fun `GIVEN collections WHEN filtering by two tags THEN only collections with both tags are returned`() {
        val userId = usersClient.createUser()
        val bothTags = collectionsClient.postCollection(
            dummyCollectionRequest.copy(name = "Both", tags = listOf("flu", "europe")),
            userId,
        )
        val onlyFlu = collectionsClient.postCollection(
            dummyCollectionRequest.copy(name = "Only flu", tags = listOf("flu")),
            userId,
        )
        val noTags = collectionsClient.postCollection(
            dummyCollectionRequest.copy(name = "No tags"),
            userId,
        )

        val results = collectionsClient.getCollections(
            userId = userId,
            tags = listOf("flu", "europe"),
            includeVariants = true,
        )

        assertThat(results, hasItem(bothTags))
        assertThat(results, not(hasItem(onlyFlu)))
        assertThat(results, not(hasItem(noTags)))
    }

    @Test
    fun `WHEN filtering by tag that no collection has THEN returns empty list`() {
        val userId = usersClient.createUser()
        collectionsClient.postCollection(dummyCollectionRequest.copy(tags = listOf("flu")), userId)

        val results = collectionsClient.getCollections(userId = userId, tags = listOf("nonexistent"))

        assertThat(results, empty())
    }

    @Test
    fun `WHEN updating collection with new tags THEN tags are replaced`() {
        val userId = usersClient.createUser()
        val created = collectionsClient.postCollection(
            dummyCollectionRequest.copy(tags = listOf("flu", "europe")),
            userId,
        )

        val updated = collectionsClient.putCollection(
            CollectionUpdate(tags = listOf("covid")),
            created.id,
            userId,
        )

        assertThat(updated.tags, contains("covid"))
    }

    @Test
    fun `WHEN updating collection with empty tags list THEN all tags are removed`() {
        val userId = usersClient.createUser()
        val created = collectionsClient.postCollection(
            dummyCollectionRequest.copy(tags = listOf("flu")),
            userId,
        )

        val updated = collectionsClient.putCollection(
            CollectionUpdate(tags = emptyList()),
            created.id,
            userId,
        )

        assertThat(updated.tags, empty())
    }

    @Test
    fun `WHEN updating collection without tags field THEN existing tags are preserved`() {
        val userId = usersClient.createUser()
        val created = collectionsClient.postCollection(
            dummyCollectionRequest.copy(tags = listOf("flu")),
            userId,
        )

        val updated = collectionsClient.putCollection(
            CollectionUpdate(name = "New Name"),
            created.id,
            userId,
        )

        assertThat(updated.tags, contains("flu"))
    }

    @Test
    fun `GIVEN collections with tags WHEN getting all tags THEN all created tags are present and sorted`() {
        val userId = usersClient.createUser()
        val uniqueTag1 = "xtest-unique-alpha-tag"
        val uniqueTag2 = "xtest-unique-beta-tag"
        val uniqueTag3 = "xtest-unique-gamma-tag"
        collectionsClient.postCollection(dummyCollectionRequest.copy(tags = listOf(uniqueTag1, uniqueTag2)), userId)
        collectionsClient.postCollection(dummyCollectionRequest.copy(tags = listOf(uniqueTag2, uniqueTag3)), userId)

        val response = collectionsClient.getCollectionTags()

        assertThat(response.tags, hasItem(uniqueTag1))
        assertThat(response.tags, hasItem(uniqueTag2))
        assertThat(response.tags, hasItem(uniqueTag3))
        val idx1 = response.tags.indexOf(uniqueTag1)
        val idx2 = response.tags.indexOf(uniqueTag2)
        val idx3 = response.tags.indexOf(uniqueTag3)
        assertThat(idx1 < idx2, equalTo(true))
        assertThat(idx2 < idx3, equalTo(true))
    }

    @Test
    fun `WHEN getting collection tags THEN tags response contains tags field`() {
        collectionsClient.getCollectionTagsRaw()
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.tags").isArray)
    }

    @Test
    fun `WHEN creating collection with duplicate tags THEN duplicates are deduplicated`() {
        val userId = usersClient.createUser()
        val collection = collectionsClient.postCollection(
            dummyCollectionRequest.copy(tags = listOf("flu", "flu", "FLU")),
            userId,
        )

        val retrieved = collectionsClient.getCollections(userId = userId)
            .first { it.id == collection.id }

        assertThat(retrieved.tags, equalTo(listOf("flu")))
    }

    @Test
    fun `GIVEN collection with multiple variants and tags WHEN getting with includeVariants THEN no duplicate tags`() {
        val userId = usersClient.createUser()
        collectionsClient.postCollection(
            dummyCollectionRequest.copy(tags = listOf("flu", "europe")),
            userId,
        )

        val collections = collectionsClient.getCollections(userId = userId, includeVariants = true)

        assertThat(collections.first().tags, containsInAnyOrder("flu", "europe"))
    }

    @Test
    fun `GIVEN collections with different tags WHEN filtering without includeVariants THEN returns matching only`() {
        val userId = usersClient.createUser()
        val fluCollection = collectionsClient.postCollection(
            dummyCollectionRequest.copy(name = "Flu", tags = listOf("flu")),
            userId,
        )
        val covidCollection = collectionsClient.postCollection(
            dummyCollectionRequest.copy(name = "Covid", tags = listOf("covid")),
            userId,
        )

        val results = collectionsClient.getCollections(userId = userId, tags = listOf("flu"))
        val resultIds = results.map { it.id }

        assertThat(resultIds, hasItem(fluCollection.id))
        assertThat(resultIds, not(hasItem(covidCollection.id)))
    }

    @Test
    fun `WHEN filtering by tag with uppercase THEN matches lowercased stored tags`() {
        val userId = usersClient.createUser()
        val collection = collectionsClient.postCollection(
            dummyCollectionRequest.copy(tags = listOf("flu")),
            userId,
        )

        val results = collectionsClient.getCollections(userId = userId, tags = listOf("FLU"), includeVariants = true)

        assertThat(results, hasItem(collection))
    }
}
