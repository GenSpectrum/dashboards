package org.genspectrum.dashboardsbackend.controller

import org.genspectrum.dashboardsbackend.api.CollectionUpdate
import org.genspectrum.dashboardsbackend.api.FilterObject
import org.genspectrum.dashboardsbackend.api.Variant
import org.genspectrum.dashboardsbackend.api.VariantRequest
import org.genspectrum.dashboardsbackend.api.VariantUpdate
import org.genspectrum.dashboardsbackend.dummyCollectionRequest
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.containsString
import org.hamcrest.Matchers.equalTo
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
class CollectionsPutTest(@param:Autowired private val collectionsClient: CollectionsClient) {

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
            filterObject = FilterObject(
                aminoAcidMutations = listOf("S:N501Y"),
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
            .andExpect(jsonPath("$.detail").value(containsString("you don't have permission to update it")))
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
            filterObject = FilterObject(
                aminoAcidMutations = listOf("S:N501Y"),
                filters = mapOf("invalidField" to "value"),
            ),
        )

        val update = CollectionUpdate(variants = listOf(invalidVariant))

        collectionsClient.putCollectionRaw(update, createdCollection.id, userId)
            .andExpect(status().isBadRequest)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.detail").value(containsString("Invalid lineage fields")))
    }

    @Test
    fun `WHEN updating variant type THEN returns 400`() {
        val userId = getNewUserId()
        val createdCollection = collectionsClient.postCollection(dummyCollectionRequest, userId)
        val firstVariant = createdCollection.variants[0] as Variant.QueryVariant

        val invalidUpdate = VariantUpdate.MutationListVariantUpdate(
            id = firstVariant.id,
            name = "Changed Type",
            filterObject = FilterObject(
                aminoAcidMutations = listOf("S:N501Y"),
            ),
        )

        val update = CollectionUpdate(variants = listOf(invalidUpdate))

        collectionsClient.putCollectionRaw(update, createdCollection.id, userId)
            .andExpect(status().isBadRequest)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.detail").value(containsString("Cannot change variant type")))
    }

    @Test
    fun `WHEN updating non-existent collection THEN returns 403`() {
        val userId = getNewUserId()
        val nonExistentId = 999999L

        collectionsClient.putCollectionRaw(CollectionUpdate(name = "Updated Name"), nonExistentId, userId)
            .andExpect(status().isForbidden)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.detail").value(containsString("you don't have permission to update it")))
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
            .andExpect(jsonPath("$.detail").value(containsString("does not belong to collection")))
    }
}
