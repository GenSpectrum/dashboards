package org.genspectrum.dashboardsbackend.api

import com.fasterxml.jackson.annotation.JsonAnyGetter
import com.fasterxml.jackson.annotation.JsonAnySetter
import com.fasterxml.jackson.annotation.JsonInclude

/**
 * A JSON object with mutation lists (keys: aminoAcidMutations, nucleotideMutations, ...)
 * as well as arbitrary extra properties (e.g. lineage filters) as top-level fields.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
class FilterObject {
    var aminoAcidMutations: List<String>? = null
    var nucleotideMutations: List<String>? = null
    var aminoAcidInsertions: List<String>? = null
    var nucleotideInsertions: List<String>? = null

    private val filters: MutableMap<String, String> = mutableMapOf()

    @JsonAnyGetter
    fun getFilters(): Map<String, String> = filters

    @JsonAnySetter
    fun set(key: String, value: String) {
        filters[key] = value
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is FilterObject) return false
        return aminoAcidMutations == other.aminoAcidMutations &&
            nucleotideMutations == other.nucleotideMutations &&
            aminoAcidInsertions == other.aminoAcidInsertions &&
            nucleotideInsertions == other.nucleotideInsertions &&
            filters == other.filters
    }

    override fun hashCode(): Int = arrayOf(
        aminoAcidMutations,
        nucleotideMutations,
        aminoAcidInsertions,
        nucleotideInsertions,
        filters,
    ).contentHashCode()
}
