package org.genspectrum.dashboardsbackend.model.triggerevaluation

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.genspectrum.dashboardsbackend.api.Organism
import org.genspectrum.dashboardsbackend.config.DashboardsConfig
import org.genspectrum.dashboardsbackend.log
import org.springframework.http.HttpHeaders.CONTENT_TYPE
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ProblemDetail
import org.springframework.stereotype.Component
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpRequest.BodyPublishers
import java.net.http.HttpResponse
import java.net.http.HttpResponse.BodyHandlers

@Component
class LapisClientProvider(
    dashboardsConfig: DashboardsConfig,
    objectMapper: ObjectMapper,
) {
    private val clients = Organism.entries.associateWith {
        LapisClient(
            baseUrl = dashboardsConfig.getOrganismConfig(it).lapisUrl,
            objectMapper = objectMapper,
        )
    }

    fun provide(organism: Organism) = clients[organism]
        ?: throw IllegalArgumentException("No LAPIS client for organism $organism registered")
}

class LapisClient(
    baseUrl: String,
    private val objectMapper: ObjectMapper,
) {
    private val aggregatedUrl = URI("$baseUrl/sample/aggregated")
    private val httpClient = HttpClient.newHttpClient()

    fun aggregated(filters: Map<String, String>): LapisResponse {
        log.info { "Calling LAPIS $aggregatedUrl with filters $filters" }

        val response = try {
            httpClient.send(
                HttpRequest.newBuilder(aggregatedUrl)
                    .POST(BodyPublishers.ofString(objectMapper.writeValueAsString(filters)))
                    .header(CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .build(),
                BodyHandlers.ofString(),
            )
        } catch (exception: Exception) {
            val message = "Could not connect to LAPIS: " + exception::class.toString() + " " + exception.message
            log.error { message }
            return LapisNotReachableError(message)
        }

        log.info { "Response from LAPIS: ${response.statusCode()}" }

        if (response.statusCode() != HttpStatus.OK.value()) {
            return handleError(response)
        }

        try {
            return objectMapper.readValue<LapisAggregatedResponse>(response.body())
        } catch (e: Exception) {
            throw RuntimeException(
                "Failed to deserialize response from LAPIS: ${response.body().truncateAfter(1000)}",
                e,
            )
        }
    }

    private fun handleError(response: HttpResponse<String>): LapisResponse {
        try {
            return objectMapper.readValue<LapisError>(response.body())
                .also { log.warn { "Got LAPIS error: $it" } }
        } catch (e: Exception) {
            throw RuntimeException(
                "Failed to deserialize error response from LAPIS: ${response.body().truncateAfter(1000)}",
                e,
            )
        }
    }

    private fun String.truncateAfter(maxLength: Int): String {
        return if (length > maxLength) {
            substring(0, maxLength) + "..."
        } else {
            this
        }
    }
}

sealed interface LapisResponse

data class LapisAggregatedResponse(
    val data: List<AggregatedData>,
    val info: LapisInfo,
) : LapisResponse

data class AggregatedData(
    val count: Int,
)

data class LapisError(
    val error: ProblemDetail,
    val info: LapisInfo,
) : LapisResponse

data class LapisInfo(
    val dataVersion: String? = null,
)

data class LapisNotReachableError(
    val message: String,
) : LapisResponse
