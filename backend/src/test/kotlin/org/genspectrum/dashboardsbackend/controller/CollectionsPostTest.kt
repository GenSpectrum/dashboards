package org.genspectrum.dashboardsbackend.controller

import org.genspectrum.dashboardsbackend.ORGANISM_WITHOUT_COLLECTIONS
import org.genspectrum.dashboardsbackend.api.FilterObject
import org.genspectrum.dashboardsbackend.api.Variant
import org.genspectrum.dashboardsbackend.api.VariantRequest
import org.genspectrum.dashboardsbackend.dummyCollectionRequest
import org.genspectrum.dashboardsbackend.dummyFilterObjectVariantRequest
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
@Import(CollectionsClient::class, UsersClient::class)
class CollectionsPostTest(
    @param:Autowired private val collectionsClient: CollectionsClient,
    @param:Autowired private val mockMvc: MockMvc,
    @param:Autowired private val usersClient: UsersClient,
) {

    @Test
    fun `WHEN creating collection THEN createdAt and updatedAt are set`() {
        val userId = usersClient.createUser()
        val createdCollection = collectionsClient.postCollection(dummyCollectionRequest, userId)

        assertThat(createdCollection.createdAt, notNullValue())
        assertThat(createdCollection.updatedAt, notNullValue())
        assertThat(createdCollection.createdAt, equalTo(createdCollection.updatedAt))
        createdCollection.variants.forEach { variant ->
            when (variant) {
                is Variant.QueryVariant -> {
                    assertThat(variant.createdAt, notNullValue())
                    assertThat(variant.updatedAt, notNullValue())
                    assertThat(variant.createdAt, equalTo(variant.updatedAt))
                }
                is Variant.FilterObjectVariant -> {
                    assertThat(variant.createdAt, notNullValue())
                    assertThat(variant.updatedAt, notNullValue())
                    assertThat(variant.createdAt, equalTo(variant.updatedAt))
                }
            }
        }
    }

    @Test
    fun `WHEN creating collection with createdAt in body THEN returns 400`() {
        val userId = usersClient.createUser()
        mockMvc.perform(
            post("/collections?userId=$userId")
                .content("""{"name":"Test","organism":"Covid","variants":[],"createdAt":"2000-01-01T00:00:00Z"}""")
                .contentType(MediaType.APPLICATION_JSON),
        ).andExpect(status().isBadRequest)
    }

    @Test
    fun `WHEN creating collection with updatedAt in body THEN returns 400`() {
        val userId = usersClient.createUser()
        mockMvc.perform(
            post("/collections?userId=$userId")
                .content("""{"name":"Test","organism":"Covid","variants":[],"updatedAt":"2000-01-01T00:00:00Z"}""")
                .contentType(MediaType.APPLICATION_JSON),
        ).andExpect(status().isBadRequest)
    }

    @Test
    fun `GIVEN collection with variants WHEN creating THEN returns with generated IDs`() {
        val userId = usersClient.createUser()
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
        val userId = usersClient.createUser()
        val request = dummyCollectionRequest.copy(
            variants = listOf(dummyQueryVariantRequest),
        )

        val createdCollection = collectionsClient.postCollection(request, userId)

        assertThat(createdCollection.variants, hasSize(1))
        assertThat(createdCollection.variants[0], instanceOf(Variant.QueryVariant::class.java))
    }

    @Test
    fun `WHEN creating collection with only mutation list variants THEN succeeds`() {
        val userId = usersClient.createUser()
        val request = dummyCollectionRequest.copy(
            variants = listOf(dummyFilterObjectVariantRequest),
        )

        val createdCollection = collectionsClient.postCollection(request, userId)

        assertThat(createdCollection.variants, hasSize(1))
        assertThat(createdCollection.variants[0], instanceOf(Variant.FilterObjectVariant::class.java))
    }

    @Test
    fun `WHEN creating collection with no variants THEN succeeds`() {
        val userId = usersClient.createUser()
        val request = dummyCollectionRequest.copy(variants = emptyList())

        val createdCollection = collectionsClient.postCollection(request, userId)

        assertThat(createdCollection.variants, empty())
    }

    @Test
    fun `WHEN creating collection with unknown organism THEN returns 400`() {
        val userId = usersClient.createUser()
        collectionsClient.postCollectionRaw(dummyCollectionRequest.copy(organism = "unknown organism"), userId)
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("\$.detail").value("Organism 'unknown organism' is not supported"))
    }

    @Test
    fun `WHEN creating collection for organism with collections disabled THEN returns 400`() {
        val userId = usersClient.createUser()
        collectionsClient.postCollectionRaw(
            dummyCollectionRequest.copy(organism = ORGANISM_WITHOUT_COLLECTIONS),
            userId,
        )
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("\$.detail").value("Collections are not supported for organism 'InfluenzaA'"))
    }

    @Test
    fun `WHEN creating variant with lineage filter THEN succeeds`() {
        val userId = usersClient.createUser()
        val variantWithLineage = VariantRequest.FilterObjectVariantRequest(
            name = "BA.2 lineage",
            description = "BA.2 variant",
            filterObject = FilterObject().apply {
                aminoAcidMutations = listOf("S:N501Y")
                set("pangoLineage", "BA.2*")
            },
        )
        val request = dummyCollectionRequest.copy(variants = listOf(variantWithLineage))

        val createdCollection = collectionsClient.postCollection(request, userId)

        assertThat(createdCollection.variants, hasSize(1))
        val variant = createdCollection.variants[0] as Variant.FilterObjectVariant
        assertThat(variant.filterObject.aminoAcidMutations, equalTo(listOf("S:N501Y")))
        assertThat(variant.filterObject.getFilters()["pangoLineage"], equalTo("BA.2*"))
    }

    @Test
    fun `WHEN creating variant with invalid lineage field THEN returns 400`() {
        val userId = usersClient.createUser()
        val variantWithInvalidLineage = VariantRequest.FilterObjectVariantRequest(
            name = "Invalid lineage",
            description = "Has invalid lineage field",
            filterObject = FilterObject().apply {
                aminoAcidMutations = emptyList()
                set("invalidLineageField", "value")
            },
        )
        val request = dummyCollectionRequest.copy(variants = listOf(variantWithInvalidLineage))

        collectionsClient.postCollectionRaw(request, userId)
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.detail").value(containsString("Invalid lineage fields for organism 'Covid'")))
            .andExpect(jsonPath("$.detail").value(containsString("invalidLineageField")))
    }

    @Test
    fun `WHEN creating variant with multiple lineage filters THEN succeeds`() {
        val userId = usersClient.createUser()
        val variantWithMultipleLineages = VariantRequest.FilterObjectVariantRequest(
            name = "Multiple lineages",
            description = "Has multiple lineage filters",
            filterObject = FilterObject().apply {
                aminoAcidMutations = listOf("S:K417N")
                set("pangoLineage", "BA.2*")
                set("nextcladePangoLineage", "BA.2.75*")
            },
        )
        val request = dummyCollectionRequest.copy(variants = listOf(variantWithMultipleLineages))

        val createdCollection = collectionsClient.postCollection(request, userId)

        val variant = createdCollection.variants[0] as Variant.FilterObjectVariant
        assertThat(variant.filterObject.getFilters()["pangoLineage"], equalTo("BA.2*"))
        assertThat(variant.filterObject.getFilters()["nextcladePangoLineage"], equalTo("BA.2.75*"))
    }

    @Test
    fun `WHEN creating variant with only aminoAcidMutations THEN succeeds`() {
        val userId = usersClient.createUser()
        val variantWithOnlyAaMutations = VariantRequest.FilterObjectVariantRequest(
            name = "Only AA mutations",
            description = "Only has amino acid mutations",
            filterObject = FilterObject().apply {
                aminoAcidMutations = listOf("S:N501Y", "S:E484K")
            },
        )
        val request = dummyCollectionRequest.copy(variants = listOf(variantWithOnlyAaMutations))

        val createdCollection = collectionsClient.postCollection(request, userId)

        val variant = createdCollection.variants[0] as Variant.FilterObjectVariant
        assertThat(variant.filterObject.aminoAcidMutations, equalTo(listOf("S:N501Y", "S:E484K")))
        assertThat(variant.filterObject.nucleotideMutations, nullValue())
    }

    @Test
    fun `WHEN creating variant with insertions THEN succeeds`() {
        val userId = usersClient.createUser()
        val variantWithInsertions = VariantRequest.FilterObjectVariantRequest(
            name = "With insertions",
            description = "Has insertions",
            filterObject = FilterObject().apply {
                aminoAcidMutations = listOf("S:N501Y")
                aminoAcidInsertions = listOf("ins_S:214:EPE")
                nucleotideInsertions = listOf("ins_22204:GAG")
            },
        )
        val request = dummyCollectionRequest.copy(variants = listOf(variantWithInsertions))

        val createdCollection = collectionsClient.postCollection(request, userId)

        val variant = createdCollection.variants[0] as Variant.FilterObjectVariant
        assertThat(variant.filterObject.aminoAcidInsertions, equalTo(listOf("ins_S:214:EPE")))
        assertThat(variant.filterObject.nucleotideInsertions, equalTo(listOf("ins_22204:GAG")))
    }

    @Test
    fun `WHEN creating variant with non-string extra property value THEN returns 400`() {
        val userId = usersClient.createUser()
        val body = """
            {
                "name": "Test",
                "organism": "Covid",
                "description": "Test",
                "variants": [{
                    "type": "filterObject",
                    "name": "Test variant",
                    "filterObject": {
                        "foo": ["bar", "baz"]
                    }
                }]
            }
        """.trimIndent()

        mockMvc.perform(
            post("/collections?userId=$userId")
                .content(body)
                .contentType(MediaType.APPLICATION_JSON),
        )
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `WHEN creating collection with lineage filter in filters field THEN succeeds`() {
        val userId = usersClient.createUser()
        val body = """
            {
                "name": "Test",
                "organism": "Covid",
                "description": "Test",
                "variants": [{
                    "type": "filterObject",
                    "name": "Test variant",
                    "filterObject": {
                        "pangoLineage": "B.1.1.7"
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
