package org.genspectrum.dashboardsbackend

import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.testcontainers.postgresql.PostgreSQLContainer

@TestConfiguration
class TestContainerConfig {
    @Bean
    fun postgreSQLContainer(): PostgreSQLContainer {
        val container: PostgreSQLContainer = PostgreSQLContainer("postgres:latest")
            .withDatabaseName("subscriptions")
            .withUsername("test")
            .withPassword("test")
        container.start()

        return container
    }
}
