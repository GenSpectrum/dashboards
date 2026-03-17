package org.genspectrum.dashboardsbackend.api

import com.fasterxml.jackson.databind.JsonMappingException
import com.fasterxml.jackson.databind.ObjectMapper
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.equalTo
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest

@SpringBootTest
class MutationListDefinitionTest {
    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Test
    fun `serializes mutation lists`() {
        val underTest = MutationListDefinition.create(
            aaMutations = listOf("S:N501Y", "S:E484K"),
            nucMutations = listOf("A23403G"),
        )

        val json = objectMapper.writeValueAsString(underTest)

        assertThat(
            json,
            equalTo("""{"aaMutations":["S:N501Y","S:E484K"],"nucMutations":["A23403G"]}"""),
        )
    }

    @Test
    fun `serializes lineage filters as top-level fields`() {
        val underTest = MutationListDefinition.create(
            aaMutations = listOf("S:N501Y"),
            lineageFilters = mapOf("lineage" to "B.1.1.7"),
        )

        val json = objectMapper.writeValueAsString(underTest)

        assertThat(
            json,
            equalTo("""{"aaMutations":["S:N501Y"],"lineage":"B.1.1.7"}"""),
        )
    }

    @Test
    fun `deserializes lineage filters from top-level fields`() {
        val json = """{"aaMutations":["S:N501Y"],"lineage":"B.1.1.7"}"""

        val result = objectMapper.readValue(json, MutationListDefinition::class.java)

        // assertThat(result.aaMutations, equalTo(listOf("S:N501Y")))
        assertThat(result.lineageFilters, equalTo(mapOf("lineage" to "B.1.1.7")))
    }

    @Test
    fun `lineageFilters field in JSON raises an error`() {
        val json = """{"aaMutations":["S:N501Y"],"lineageFilters":{"lineage":"B.1.1.7"}}"""

        assertThrows<JsonMappingException> {
            objectMapper.readValue(json, MutationListDefinition::class.java)
        }
    }

    @Test
    fun `lineage filter with non-string value throws`() {
        val json = """{"lineage": 42}"""

        println("LALALALA")
        val result = objectMapper.readValue(json, MutationListDefinition::class.java);
        println("==================")
        println(result)
        println(result.lineageFilters)

        assertThrows<JsonMappingException> {
            objectMapper.readValue(json, MutationListDefinition::class.java)
        }
    }
}
