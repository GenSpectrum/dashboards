package org.genspectrum.dashboardsbackend.api

import com.fasterxml.jackson.databind.ObjectMapper
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.equalTo
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest

@SpringBootTest
class FilterObjectTest {
    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Test
    fun `serializes mutation lists`() {
        val underTest = FilterObject(
            aminoAcidMutations = listOf("S:N501Y", "S:E484K"),
            nucleotideMutations = listOf("A23403G"),
        )

        val json = objectMapper.writeValueAsString(underTest)

        assertThat(
            json,
            equalTo("""{"aminoAcidMutations":["S:N501Y","S:E484K"],"nucleotideMutations":["A23403G"]}"""),
        )
    }

    @Test
    fun `serializes lineage filters under filters key`() {
        val underTest = FilterObject(
            aminoAcidMutations = listOf("S:N501Y"),
            filters = mapOf("lineage" to "B.1.1.7"),
        )

        val json = objectMapper.writeValueAsString(underTest)

        assertThat(
            json,
            equalTo("""{"aminoAcidMutations":["S:N501Y"],"filters":{"lineage":"B.1.1.7"}}"""),
        )
    }

    @Test
    fun `deserializes lineage filters from filters key`() {
        val json = """{"aminoAcidMutations":["S:N501Y"],"filters":{"lineage":"B.1.1.7"}}"""

        val result = objectMapper.readValue(json, FilterObject::class.java)

        assertThat(result.aminoAcidMutations, equalTo(listOf("S:N501Y")))
        assertThat(result.filters, equalTo(mapOf("lineage" to "B.1.1.7")))
    }
}
