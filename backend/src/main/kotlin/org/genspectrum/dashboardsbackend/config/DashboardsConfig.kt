package org.genspectrum.dashboardsbackend.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "dashboards")
data class DashboardsConfig(
    val organisms: Map<String, OrganismConfig>,
) {
    fun getOrganismConfig(organism: String) = organisms[organism]
        ?: throw IllegalArgumentException("No configuration found for organism $organism")
}

data class OrganismConfig(
    val lapis: LapisConfig,
    val externalNavigationLinks: List<ExternalNavigationLink>?,
)

data class LapisConfig(
    val url: String,
    val mainDateField: String,
    val additionalFilters: Map<String, String>?,
)

data class ExternalNavigationLink(
    val url: String,
    val label: String,
    val menuIcon: String,
    val description: String,
)
