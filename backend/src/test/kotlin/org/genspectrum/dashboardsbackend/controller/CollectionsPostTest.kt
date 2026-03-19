package org.genspectrum.dashboardsbackend.controller

import org.genspectrum.dashboardsbackend.api.FilterObject
import org.genspectrum.dashboardsbackend.api.Variant
import org.genspectrum.dashboardsbackend.api.VariantRequest
import org.genspectrum.dashboardsbackend.dummyCollectionRequest
import org.genspectrum.dashboardsbackend.dummyMutationListVariantRequest
import org.genspectrum.dashboardsbackend.dummyQueryVariantRequest
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.containsString
import org.hamcrest.Matchers.empty
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.hasSize
import org.hamcrest.Matchers.instanceOf
import org.hamcrest.Matchers.notNullValue
import org.hamcrest.Matchers.nullValue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@SpringBootTest
@AutoConfigureMockMvc
@Import(CollectionsClient::class)
class CollectionsPostTest(
    @param:Autowired private val collectionsClient: CollectionsClient,
    @param:Autowired private val mockMvc: MockMvc,
) {

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
        assertThat(createdCollection.variants[0], instanceOf(Variant.QueryVariant::class.java))
    }

    @Test
    fun `WHEN creating collection with only mutation list variants THEN succeeds`() {
        val userId = getNewUserId()
        val request = dummyCollectionRequest.copy(
            variants = listOf(dummyMutationListVariantRequest),
        )

        val createdCollection = collectionsClient.postCollection(request, userId)

        assertThat(createdCollection.variants, hasSize(1))
        assertThat(createdCollection.variants[0], instanceOf(Variant.MutationListVariant::class.java))
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
            .andExpect(jsonPath("\$.detail").value("Organism 'unknown organism' is not supported"))
    }

    @Test
    fun `WHEN creating variant with lineage filter THEN succeeds`() {
        val userId = getNewUserId()
        val variantWithLineage = VariantRequest.MutationListVariantRequest(
            name = "BA.2 lineage",
            description = "BA.2 variant",
            filterObject = FilterObject(
                aminoAcidMutations = listOf("S:N501Y"),
                filters = mapOf("pangoLineage" to "BA.2*"),
            ),
        )
        val request = dummyCollectionRequest.copy(variants = listOf(variantWithLineage))

        val createdCollection = collectionsClient.postCollection(request, userId)

        assertThat(createdCollection.variants, hasSize(1))
        val variant = createdCollection.variants[0] as Variant.MutationListVariant
        assertThat(variant.filterObject.aminoAcidMutations, equalTo(listOf("S:N501Y")))
        assertThat(variant.filterObject.filters!!["pangoLineage"], equalTo("BA.2*"))
    }

    @Test
    fun `WHEN creating variant with invalid lineage field THEN returns 400`() {
        val userId = getNewUserId()
        val variantWithInvalidLineage = VariantRequest.MutationListVariantRequest(
            name = "Invalid lineage",
            description = "Has invalid lineage field",
            filterObject = FilterObject(
                aminoAcidMutations = emptyList(),
                filters = mapOf("invalidLineageField" to "value"),
            ),
        )
        val request = dummyCollectionRequest.copy(variants = listOf(variantWithInvalidLineage))

        collectionsClient.postCollectionRaw(request, userId)
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.detail").value(containsString("Invalid lineage fields for organism 'Covid'")))
            .andExpect(jsonPath("$.detail").value(containsString("invalidLineageField")))
    }

    @Test
    fun `WHEN creating variant with multiple lineage filters THEN succeeds`() {
        val userId = getNewUserId()
        val variantWithMultipleLineages = VariantRequest.MutationListVariantRequest(
            name = "Multiple lineages",
            description = "Has multiple lineage filters",
            filterObject = FilterObject(
                aminoAcidMutations = listOf("S:K417N"),
                filters = mapOf(
                    "pangoLineage" to "BA.2*",
                    "nextcladePangoLineage" to "BA.2.75*",
                ),
            ),
        )
        val request = dummyCollectionRequest.copy(variants = listOf(variantWithMultipleLineages))

        val createdCollection = collectionsClient.postCollection(request, userId)

        val variant = createdCollection.variants[0] as Variant.MutationListVariant
        assertThat(variant.filterObject.filters!!["pangoLineage"], equalTo("BA.2*"))
        assertThat(variant.filterObject.filters!!["nextcladePangoLineage"], equalTo("BA.2.75*"))
    }

    @Test
    fun `WHEN creating variant with only aminoAcidMutations THEN succeeds`() {
        val userId = getNewUserId()
        val variantWithOnlyAaMutations = VariantRequest.MutationListVariantRequest(
            name = "Only AA mutations",
            description = "Only has amino acid mutations",
            filterObject = FilterObject(
                aminoAcidMutations = listOf("S:N501Y", "S:E484K"),
            ),
        )
        val request = dummyCollectionRequest.copy(variants = listOf(variantWithOnlyAaMutations))

        val createdCollection = collectionsClient.postCollection(request, userId)

        val variant = createdCollection.variants[0] as Variant.MutationListVariant
        assertThat(variant.filterObject.aminoAcidMutations, equalTo(listOf("S:N501Y", "S:E484K")))
        assertThat(variant.filterObject.nucleotideMutations, nullValue())
    }

    @Test
    fun `WHEN creating variant with insertions THEN succeeds`() {
        val userId = getNewUserId()
        val variantWithInsertions = VariantRequest.MutationListVariantRequest(
            name = "With insertions",
            description = "Has insertions",
            filterObject = FilterObject(
                aminoAcidMutations = listOf("S:N501Y"),
                aminoAcidInsertions = listOf("ins_S:214:EPE"),
                nucleotideInsertions = listOf("ins_22204:GAG"),
            ),
        )
        val request = dummyCollectionRequest.copy(variants = listOf(variantWithInsertions))

        val createdCollection = collectionsClient.postCollection(request, userId)

        val variant = createdCollection.variants[0] as Variant.MutationListVariant
        assertThat(variant.filterObject.aminoAcidInsertions, equalTo(listOf("ins_S:214:EPE")))
        assertThat(variant.filterObject.nucleotideInsertions, equalTo(listOf("ins_22204:GAG")))
    }

    @Test
    fun `WHEN creating collection with lineage filter in filters field THEN succeeds`() {
        val userId = getNewUserId()
        val body = """
            {
                "name": "Test",
                "organism": "Covid",
                "description": "Test",
                "variants": [{
                    "type": "mutationList",
                    "name": "Test variant",
                    "mutationList": {
                        "filters": {"pangoLineage": "B.1.1.7"}
                    }
                }]
            }
        """.trimIndent()

        mockMvc.perform(
            post("/collections?userId=$userId")
                .content(body)
                .contentType(MediaType.APPLICATION_JSON),
        )
            .andExpect(status().isCreated)
    }
}
