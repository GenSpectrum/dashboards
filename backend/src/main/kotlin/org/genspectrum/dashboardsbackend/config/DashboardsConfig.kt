package org.genspectrum.dashboardsbackend.config

import org.genspectrum.dashboardsbackend.controller.BadRequestException
import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "dashboards")
data class DashboardsConfig(val organisms: Map<String, OrganismConfig>, val systemUser: SystemUserConfig? = null) {
    fun getOrganismConfig(organism: String) = organisms[organism]
        ?: throw IllegalArgumentException("No configuration found for organism $organism")

    fun validateIsValidOrganism(organism: String) {
        if (!organisms.containsKey(organism)) {
            throw BadRequestException("Organism '$organism' is not supported")
        }
    }

    fun validateCollectionsEnabled(organism: String) {
        if (!getOrganismConfig(organism).hasCollections) {
            throw BadRequestException("Collections are not supported for organism '$organism'")
        }
    }
}

data class OrganismConfig(
    val lapis: LapisConfig,
    val externalNavigationLinks: List<ExternalNavigationLink>?,
    val hasCollections: Boolean = true,
)

data class LapisConfig(
    val url: String,
    val mainDateField: String,
    val lineageFields: List<String>?,
    val additionalFilters: Map<String, String>?,
)

data class ExternalNavigationLink(val url: String, val label: String, val menuIcon: String, val description: String)

data class SystemUserConfig(
    val githubId: String,
    val name: String,
    val email: String? = null,
    val apiKey: String? = null,
) {
    init {
        require(apiKey == null || apiKey.length >= 32) { "systemUser.apiKey must be at least 32 characters" }
    }

    override fun toString() =
        "SystemUserConfig(githubId=$githubId, name=$name, email=$email, apiKey=${if (apiKey != null) "***" else "null"})"
}
