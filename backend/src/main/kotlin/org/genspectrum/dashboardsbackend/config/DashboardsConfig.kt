package org.genspectrum.dashboardsbackend.config

import org.genspectrum.dashboardsbackend.api.Organism
import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "dashboards")
data class DashboardsConfig(
    val organisms: Map<Organism, OrganismConfig>,
) {
    fun getOrganismConfig(organism: Organism) = organisms[organism]
        ?: throw IllegalArgumentException("No configuration found for organism $organism")
}

data class OrganismConfig(
    val lapis: LapisConfig,
)

data class LapisConfig(
    val url: String,
    val mainDateField: String,
    val locationFields: List<String>,
    val lineageField: String,
    val hostField: String,
    val authorsField: String?,
    val authorAffiliationsField: String?,
    val originatingLabField: String?,
    val submittingLabField: String?,
    val additionalFilters: Map<String, String>?,
)
