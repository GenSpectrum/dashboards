package org.genspectrum.dashboardsbackend.logging

import jakarta.servlet.http.HttpServletRequest
import org.springframework.stereotype.Component
import org.springframework.web.filter.AbstractRequestLoggingFilter

@Component
class RequestLogger : AbstractRequestLoggingFilter() {
    init {
        isIncludeQueryString = true
        isIncludePayload = true
        maxPayloadLength = 1000
        isIncludeHeaders = false
    }

    override fun shouldLog(request: HttpServletRequest) = logger.isInfoEnabled

    override fun beforeRequest(request: HttpServletRequest, message: String) {
        logger.info(message)
    }

    override fun afterRequest(request: HttpServletRequest, message: String) {
        // no op
    }
}
