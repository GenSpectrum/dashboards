package org.genspectrum.dashboardsbackend.api

import com.fasterxml.jackson.annotation.JsonInclude

/**
 * A JSON object with mutation lists (keys: aaMutations, nucMutations, ...)
 * as well as lineage filtering under the "filters" key
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
data class MutationListDefinition(
    val aaMutations: List<String>? = null,
    val nucMutations: List<String>? = null,
    val aaInsertions: List<String>? = null,
    val nucInsertions: List<String>? = null,
    val filters: Map<String, String>? = null,
)
