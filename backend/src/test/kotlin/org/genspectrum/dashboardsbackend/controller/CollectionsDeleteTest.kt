package org.genspectrum.dashboardsbackend.controller

import org.genspectrum.dashboardsbackend.dummyCollectionRequest
import org.hamcrest.Matchers.containsString
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
@Import(CollectionsClient::class, UsersClient::class)
class CollectionsDeleteTest(
    @param:Autowired private val collectionsClient: CollectionsClient,
    @param:Autowired private val usersClient: UsersClient,
) {

    @Test
    fun `WHEN owner deletes collection THEN succeeds and collection is removed`() {
        val userId = usersClient.createUser()
        val createdCollection = collectionsClient.postCollection(dummyCollectionRequest, userId)

        collectionsClient.deleteCollection(createdCollection.id, userId)

        collectionsClient.getCollectionRaw(createdCollection.id)
            .andExpect(status().isNotFound)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.detail").value("Collection ${createdCollection.id} not found"))
    }

    @Test
    fun `WHEN non-owner deletes collection THEN returns 403 forbidden`() {
        val owner = usersClient.createUser()
        val nonOwner = usersClient.createUser()
        val createdCollection = collectionsClient.postCollection(dummyCollectionRequest, owner)

        collectionsClient.deleteCollectionRaw(createdCollection.id, nonOwner)
            .andExpect(status().isForbidden)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.detail").value(containsString("you don't have permission to delete it")))
    }

    @Test
    fun `WHEN deleting non-existent collection THEN returns 403`() {
        val userId = usersClient.createUser()
        val nonExistentId = 999999L

        collectionsClient.deleteCollectionRaw(nonExistentId, userId)
            .andExpect(status().isForbidden)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.detail").value(containsString("not found or you don't have permission")))
    }
}
