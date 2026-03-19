package org.genspectrum.dashboardsbackend.api

import com.fasterxml.jackson.annotation.JsonInclude

/**
 * A JSON object with mutation lists (keys: aminoAcidMutations, nucleotideMutations, ...)
 * as well as lineage filtering under the "filters" key
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
data class FilterObject(
    val aminoAcidMutations: List<String>? = null,
    val nucleotideMutations: List<String>? = null,
    val aminoAcidInsertions: List<String>? = null,
    val nucleotideInsertions: List<String>? = null,
    val filters: Map<String, String>? = null,
)
