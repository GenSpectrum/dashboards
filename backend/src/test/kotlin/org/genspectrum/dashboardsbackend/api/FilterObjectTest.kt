package org.genspectrum.dashboardsbackend.api

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.exc.MismatchedInputException
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.equalTo
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest

@SpringBootTest
class FilterObjectTest {
    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Test
    fun `WHEN serializing full object with all fields and extra filter THEN produces correct JSON`() {
        val underTest = FilterObject().apply {
            aminoAcidMutations = listOf("S:N501Y", "S:E484K")
            nucleotideMutations = listOf("A23403G")
            aminoAcidInsertions = listOf("ins_S:214:EPE")
            nucleotideInsertions = listOf("ins_22204:GAG")
            set("foo", "bar")
        }

        val json = objectMapper.writeValueAsString(underTest)

        assertThat(
            json,
            equalTo(
                """{"aminoAcidMutations":["S:N501Y","S:E484K"],"nucleotideMutations":["A23403G"],"aminoAcidInsertions":["ins_S:214:EPE"],"nucleotideInsertions":["ins_22204:GAG"],"foo":"bar"}""",
            ),
        )
    }

    @Test
    fun `WHEN serializing object with only nucleotideMutations THEN omits null fields`() {
        val underTest = FilterObject().apply {
            nucleotideMutations = listOf("A23403G")
        }

        val json = objectMapper.writeValueAsString(underTest)

        assertThat(
            json,
            equalTo("""{"nucleotideMutations":["A23403G"]}"""),
        )
    }

    @Test
    fun `WHEN deserializing full object with all fields and extra filter THEN all properties are set`() {
        val json =
            """{"aminoAcidMutations":["S:N501Y","S:E484K"],"nucleotideMutations":["A23403G"],"aminoAcidInsertions":["ins_S:214:EPE"],"nucleotideInsertions":["ins_22204:GAG"],"foo":"bar"}"""

        val result = objectMapper.readValue(json, FilterObject::class.java)

        assertThat(result.aminoAcidMutations, equalTo(listOf("S:N501Y", "S:E484K")))
        assertThat(result.nucleotideMutations, equalTo(listOf("A23403G")))
        assertThat(result.aminoAcidInsertions, equalTo(listOf("ins_S:214:EPE")))
        assertThat(result.nucleotideInsertions, equalTo(listOf("ins_22204:GAG")))
        assertThat(result.getFilters(), equalTo(mapOf("foo" to "bar")))
    }

    @Test
    fun `WHEN deserializing object with only nucleotideMutations and extra filter THEN succeeds`() {
        val json = """{"nucleotideMutations":["A23403G"],"foo":"bar"}"""

        val result = objectMapper.readValue(json, FilterObject::class.java)

        assertThat(result.nucleotideMutations, equalTo(listOf("A23403G")))
        assertThat(result.getFilters(), equalTo(mapOf("foo" to "bar")))
    }

    @Test
    fun `WHEN deserializing extra property with non-string value THEN throws error`() {
        val json = """{"foo": ["bar", "baz"]}"""

        assertThrows<MismatchedInputException> {
            objectMapper.readValue(json, FilterObject::class.java)
        }
    }
}
