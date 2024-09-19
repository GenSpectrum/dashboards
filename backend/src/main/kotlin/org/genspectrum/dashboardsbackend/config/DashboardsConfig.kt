package org.genspectrum.dashboardsbackend.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "dashboards")
data class DashboardsConfig(
    val covid: OrganismConfig,
    val h5n1: OrganismConfig,
    val mpox: OrganismConfig,
    val westNile: OrganismConfig,
    val rsvA: OrganismConfig,
    val rsvB: OrganismConfig,
)

data class OrganismConfig(
    val lapisUrl: String,
)
