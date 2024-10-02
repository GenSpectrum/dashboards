package org.genspectrum.dashboardsbackend.config

import io.swagger.v3.oas.models.headers.Header
import io.swagger.v3.oas.models.media.StringSchema
import io.swagger.v3.oas.models.parameters.HeaderParameter
import org.flywaydb.core.Flyway
import org.genspectrum.dashboardsbackend.logging.REQUEST_ID_HEADER
import org.genspectrum.dashboardsbackend.logging.REQUEST_ID_HEADER_DESCRIPTION
import org.jetbrains.exposed.spring.autoconfigure.ExposedAutoConfiguration
import org.springdoc.core.customizers.OperationCustomizer
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

    @Bean
    fun headerCustomizer() = OperationCustomizer { operation, _ ->
        val foundRequestIdHeaderParameter = operation.parameters?.any { it.name == REQUEST_ID_HEADER }
        if (foundRequestIdHeaderParameter == false || foundRequestIdHeaderParameter == null) {
            operation.addParametersItem(
                HeaderParameter().apply {
                    name = REQUEST_ID_HEADER
                    required = false
                    example = "1747481c-816c-4b60-af20-a61717a35067"
                    description = REQUEST_ID_HEADER_DESCRIPTION
                    schema = StringSchema()
                },
            )
        }
        for ((_, response) in operation.responses) {
            if (response.headers == null || !response.headers.containsKey(REQUEST_ID_HEADER)) {
                response.addHeaderObject(
                    REQUEST_ID_HEADER,
                    Header().apply {
                        description = REQUEST_ID_HEADER_DESCRIPTION
                        required = false
                        example = "1747481c-816c-4b60-af20-a61717a35067"
                        schema = StringSchema()
                    },
                )
            }
        }
        operation
    }
}
