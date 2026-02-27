import type { DetailedMutationsQuery } from './types';

/**
 * Converts a detailedMutations query to a LAPIS query string.
 * Supports lineage filters, mutations, and insertions.
 * Returns an empty string if the query is empty.
 */
export function detailedMutationsToQuery(query: DetailedMutationsQuery): string {
    const parts: string[] = [];

    // Add lineage filters
    if (query.pangoLineage) {
        parts.push(`pangoLineage=${query.pangoLineage}`);
    }
    if (query.nextcladePangoLineage) {
        parts.push(`nextcladePangoLineage=${query.nextcladePangoLineage}`);
    }

    // Add mutations and insertions
    parts.push(
        ...(query.nucMutations ?? []),
        ...(query.aaMutations ?? []),
        ...(query.nucInsertions ?? []),
        ...(query.aaInsertions ?? []),
    );

    // Join with AND logic (& in LAPIS query syntax), or empty string if no parts
    return parts.join(' & ');
}
