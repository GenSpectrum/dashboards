package org.genspectrum.dashboardsbackend.controller

import org.genspectrum.dashboardsbackend.KnownTestOrganisms
import org.genspectrum.dashboardsbackend.config.SystemUserInitializer
import org.genspectrum.dashboardsbackend.dummyCollectionRequest
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.hasItem
import org.hamcrest.Matchers.not
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.test.context.TestPropertySource

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(
    properties = [
        "dashboards.system-user.github-id=test-system-user-exclude-test",
        "dashboards.system-user.name=Test Bot",
    ],
)
@Import(CollectionsClient::class, UsersClient::class)
class CollectionsExcludeSystemCollectionsTest(
    @param:Autowired private val collectionsClient: CollectionsClient,
    @param:Autowired private val usersClient: UsersClient,
    @param:Autowired private val systemUserInitializer: SystemUserInitializer,
) {
    @Test
    fun `GIVEN system and regular user collections WHEN excludeSystemCollections=true THEN only regular returned`() {
        val systemUserId = requireNotNull(systemUserInitializer.getSystemUserId())
        val regularUserId = usersClient.createUser()

        val systemCollection = collectionsClient.postCollection(
            dummyCollectionRequest.copy(name = "System Collection", organism = KnownTestOrganisms.Covid.name),
            systemUserId,
        )
        val regularCollection = collectionsClient.postCollection(
            dummyCollectionRequest.copy(name = "Regular Collection", organism = KnownTestOrganisms.Covid.name),
            regularUserId,
        )

        val collections = collectionsClient.getCollections(excludeSystemCollections = true)

        assertThat(collections, hasItem(regularCollection))
        assertThat(collections, not(hasItem(systemCollection)))
    }

    @Test
    fun `GIVEN system user collection WHEN not excluding system collections THEN system collection is included`() {
        val systemUserId = requireNotNull(systemUserInitializer.getSystemUserId())

        val systemCollection = collectionsClient.postCollection(
            dummyCollectionRequest.copy(name = "System Collection Visible", organism = KnownTestOrganisms.Covid.name),
            systemUserId,
        )

        val collections = collectionsClient.getCollections(excludeSystemCollections = false)

        assertThat(collections, hasItem(systemCollection))
    }
}
