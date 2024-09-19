package org.genspectrum.dashboardsbackend.config

import org.flywaydb.core.Flyway
import org.jetbrains.exposed.spring.autoconfigure.ExposedAutoConfiguration
import org.springframework.boot.autoconfigure.ImportAutoConfiguration
import org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import javax.sql.DataSource

@Configuration
@ImportAutoConfiguration(
    value = [ExposedAutoConfiguration::class],
    exclude = [DataSourceTransactionManagerAutoConfiguration::class],
)
@ConfigurationPropertiesScan("org.genspectrum.dashboardsbackend.config")
class BackendSpringConfig {

    @Bean
    fun getFlyway(dataSource: DataSource): Flyway {
        val configuration = Flyway.configure()
            .baselineOnMigrate(true)
            .dataSource(dataSource)
            .validateMigrationNaming(true)
        val flyway = Flyway(configuration)
        flyway.migrate()
        return flyway
    }
}
