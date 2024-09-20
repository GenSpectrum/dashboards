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
    private val clients = mapOf(
        Organism.COVID to LapisClient(
            baseUrl = dashboardsConfig.covid.lapisUrl,
            objectMapper = objectMapper,
        ),
        Organism.H5N1 to LapisClient(
            baseUrl = dashboardsConfig.h5n1.lapisUrl,
            objectMapper = objectMapper,
        ),
        Organism.MPOX to LapisClient(
            baseUrl = dashboardsConfig.mpox.lapisUrl,
            objectMapper = objectMapper,
        ),
        Organism.WEST_NILE to LapisClient(
            baseUrl = dashboardsConfig.westNile.lapisUrl,
            objectMapper = objectMapper,
        ),
        Organism.RSV_A to LapisClient(
            baseUrl = dashboardsConfig.rsvA.lapisUrl,
            objectMapper = objectMapper,
        ),
        Organism.RSV_B to LapisClient(
            baseUrl = dashboardsConfig.rsvB.lapisUrl,
            objectMapper = objectMapper,
        ),
    )

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

        if (response.statusCode() != HttpStatus.OK.value()) {
            return handleError(response)
        }

        return objectMapper.readValue<LapisAggregatedResponse>(response.body())
    }

    private fun handleError(response: HttpResponse<String>): LapisError {
        TODO("Not yet implemented")
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
    val dataVersion: String?,
)

data class LapisNotReachableError(
    val message: String,
) : LapisResponse
