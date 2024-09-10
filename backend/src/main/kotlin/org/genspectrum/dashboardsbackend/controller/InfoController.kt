package org.genspectrum.dashboardsbackend.controller

import io.swagger.v3.oas.annotations.Hidden
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Hidden
@RestController
class InfoController {
    @RequestMapping("/", produces = [MediaType.TEXT_HTML_VALUE])
    fun htmlInfo(request: HttpServletRequest) = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>GenSpectrum Dashboards Backend</title>
        </head>
        <body>
            <h1>Welcome to the GenSpectrum Dashboards Backend</h1>
            <a href="${request.requestURL}swagger-ui/index.html">Visit our swagger-ui</a>
        </body>
        </html>
    """.trimIndent()
}
