package org.genspectrum.dashboardsbackend.config

import org.genspectrum.dashboardsbackend.api.Organism
import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "dashboards")
data class DashboardsConfig(
    val covid: OrganismConfig,
    val h5n1: OrganismConfig,
    val mpox: OrganismConfig,
    val westNile: OrganismConfig,
    val rsvA: OrganismConfig,
    val rsvB: OrganismConfig,
) {
    fun getOrganismConfig(organism: Organism) = when (organism) {
        Organism.COVID -> covid
        Organism.H5N1 -> h5n1
        Organism.MPOX -> mpox
        Organism.WEST_NILE -> westNile
        Organism.RSV_A -> rsvA
        Organism.RSV_B -> rsvB
    }
}

data class OrganismConfig(
    val lapisUrl: String,
    val lapisMainDateField: String,
)
