package org.genspectrum.dashboardsbackend.controller

import org.genspectrum.dashboardsbackend.log
import org.springframework.http.HttpStatus
import org.springframework.http.HttpStatusCode
import org.springframework.http.MediaType
import org.springframework.http.ProblemDetail
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.context.request.WebRequest
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler

@ControllerAdvice
class ExceptionHandler : ResponseEntityExceptionHandler() {
    @ExceptionHandler(Throwable::class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    fun handleUnexpectedException(e: Throwable): ResponseEntity<ProblemDetail> {
        log.error(e) { "Caught unexpected exception ${e.javaClass}: ${e.message}" }

        return responseEntity(
            HttpStatus.INTERNAL_SERVER_ERROR,
            e.message,
        )
    }

    @ExceptionHandler(BadRequestException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleBadRequestException(e: Exception): ResponseEntity<ProblemDetail> {
        log.info { "Caught ${e.javaClass}: ${e.message}" }

        return responseEntity(
            HttpStatus.BAD_REQUEST,
            e.message,
        )
    }

    @ExceptionHandler(NotFoundException::class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    fun handleNotFoundException(e: Exception): ResponseEntity<ProblemDetail> {
        log.info { "Caught ${e.javaClass}: ${e.message}" }

        return responseEntity(
            HttpStatus.NOT_FOUND,
            e.message,
        )
    }

    private fun responseEntity(httpStatus: HttpStatus, detail: String?): ResponseEntity<ProblemDetail> =
        responseEntity(httpStatus, httpStatus.reasonPhrase, detail)

    private fun responseEntity(
        httpStatus: HttpStatusCode,
        title: String,
        detail: String?,
    ): ResponseEntity<ProblemDetail> = ResponseEntity
        .status(httpStatus)
        .contentType(MediaType.APPLICATION_JSON)
        .body(
            ProblemDetail.forStatus(httpStatus).also {
                it.title = title
                it.detail = detail
            },
        )

    override fun createProblemDetail(
        ex: java.lang.Exception,
        status: HttpStatusCode,
        defaultDetail: String,
        detailMessageCode: String?,
        detailMessageArguments: Array<out Any>?,
        request: WebRequest,
    ): ProblemDetail {
        log.warn { "Caught ${ex.javaClass}: ${ex.message}" }

        return super.createProblemDetail(ex, status, defaultDetail, detailMessageCode, detailMessageArguments, request)
    }
}

class BadRequestException(message: String) : RuntimeException(message)
class NotFoundException(message: String) : RuntimeException(message)
