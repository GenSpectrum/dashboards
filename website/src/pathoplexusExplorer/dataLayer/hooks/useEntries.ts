import { useLineageHierarchy, useScopeFilters } from './analyses.ts';
import { combineQueryResults, type Loadable } from './queryResult.ts';
import { useRows } from './rhydbQuery.ts';
import { CATALOG } from '../../domain/catalog.ts';
import { entryScopeOf } from '../../domain/entryScopes.ts';
import type { ReportRef } from '../../domain/reports.ts';
import { accessionListQuery, entryTermsOf, type EntryTerms } from '../queries/accessionList.ts';
import { groupAcross } from '../queries/builders.ts';
import { COLUMNS } from '../queries/columns.ts';
import type { Queryable } from '../transport/relation.ts';

export type ReportEntries = {
    terms: Loadable<EntryTerms>;
    list: Queryable | undefined;
};

/** Pass a report only once it is ready to count, so that nothing is listed for a report without an analysis. */
export function useReportEntries(reference: ReportRef | undefined): ReportEntries {
    const hierarchy = useLineageHierarchy(CATALOG);
    const scope =
        reference === undefined || hierarchy.data === undefined ? undefined : entryScopeOf(reference, hierarchy.data);
    const resolved = useScopeFilters(scope === undefined ? [] : [scope], CATALOG);
    const entry = resolved.data?.[0];
    const counts = useRows(
        entry === undefined
            ? undefined
            : groupAcross({ tables: entry.tables, filter: entry.filter, columns: [COLUMNS.dataUseTerms] }),
        'Data use terms',
    );
    return {
        terms: combineQueryResults(counts.data === undefined ? undefined : entryTermsOf(counts.data), [
            hierarchy,
            resolved,
            counts,
        ]),
        list: entry === undefined ? undefined : accessionListQuery(entry.tables, entry.filter),
    };
}
