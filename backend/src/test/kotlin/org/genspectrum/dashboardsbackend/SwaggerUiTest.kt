package org.genspectrum.dashboardsbackend

import org.hamcrest.core.StringContains.containsString
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.content
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import tools.jackson.dataformat.yaml.YAMLMapper
import tools.jackson.module.kotlin.kotlinModule

@SpringBootTest
@AutoConfigureMockMvc
class SwaggerUiTest(@param:Autowired val mockMvc: MockMvc) {

    @Test
    fun `Swagger UI endpoint is reachable`() {
        mockMvc.perform(get("/swagger-ui/index.html"))
            .andExpect(status().isOk)
            .andExpect(content().contentType("text/html"))
            .andExpect(content().string(containsString("Swagger UI")))
    }

    @Test
    fun `JSON API docs are available`() {
        mockMvc.perform(get("/v3/api-docs"))
            .andExpect(status().isOk)
            .andExpect(content().contentType("application/json"))
            .andExpect(jsonPath("\$.openapi").exists())
            .andExpect(jsonPath("\$.paths./subscriptions").exists())
    }

    @Test
    fun `YAML API docs are available`() {
        val result = mockMvc.perform(get("/v3/api-docs.yaml"))
            .andExpect(status().isOk)
            .andExpect(content().contentType("application/vnd.oai.openapi"))
            .andReturn()

        val objectMapper = YAMLMapper.builder().addModule(kotlinModule()).build()
        val yaml = objectMapper.readTree(result.response.contentAsString)
        assertTrue(yaml.has("openapi"))
        assertTrue(yaml.get("paths").has("/subscriptions"))
    }
}
