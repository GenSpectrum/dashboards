package org.genspectrum.dashboardsbackend.api

import com.fasterxml.jackson.annotation.JsonAnyGetter
import com.fasterxml.jackson.annotation.JsonAnySetter
import com.fasterxml.jackson.annotation.JsonIgnore

/**
 * A JSON object with mutation lists (keys: aaMutations, nucMutations, ...)
 * as well as lineage filtering (keys are defined by the organism config)
 */
data class MutationListDefinition(
    val aaMutations: List<String>? = null,
    val nucMutations: List<String>? = null,
    val aaInsertions: List<String>? = null,
    val nucInsertions: List<String>? = null,
) {
    @JsonIgnore
    private val lineageFiltersInternal: MutableMap<String, String> = mutableMapOf()

    val lineageFilters: Map<String, String>
        get() = lineageFiltersInternal

    @get:JsonAnyGetter
    val additionalProperties: Map<String, String>
        get() = lineageFiltersInternal

    @JsonAnySetter
    fun put(key: String, value: Any) {
        if (key !in KNOWN_FIELDS && value is String) {
            lineageFiltersInternal[key] = value
        }
    }

    companion object {
        private val KNOWN_FIELDS = setOf("aaMutations", "nucMutations", "aaInsertions", "nucInsertions")

        fun create(
            aaMutations: List<String>? = null,
            nucMutations: List<String>? = null,
            aaInsertions: List<String>? = null,
            nucInsertions: List<String>? = null,
            lineageFilters: Map<String, String> = emptyMap(),
        ): MutationListDefinition {
            val definition = MutationListDefinition(aaMutations, nucMutations, aaInsertions, nucInsertions)
            lineageFilters.forEach { (key, value) ->
                definition.put(key, value)
            }
            return definition
        }
    }
}
