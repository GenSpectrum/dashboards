import { entryScopeOf } from './entryScopes.ts';
import type { ReportRef } from './kinds.ts';
import { CATALOG } from '../domain/catalog.ts';
import { merged, useLineageHierarchy, useScopeFilters, type Loadable } from '../rhydb/hooks/analyses.ts';
import { useRows } from '../rhydb/hooks/rhydb.ts';
import { dataUseTermsAcross, groupAcross } from '../rhydb/queries/builders.ts';
import { COLUMNS } from '../rhydb/queries/scope.ts';
import type { Queryable } from '../rhydb/transport/relation.ts';
import type { RhydbRow } from '../rhydb/transport/row.ts';

export type EntryTerms = { total: number; restricted: number };

export type ReportEntries = {
    terms: Loadable<EntryTerms>;
    list: Queryable | undefined;
};

const RESTRICTED = 'RESTRICTED';

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
        terms: merged(counts.data === undefined ? undefined : entryTermsOf(counts.data), [hierarchy, resolved, counts]),
        list: entry === undefined ? undefined : dataUseTermsAcross({ tables: entry.tables, filter: entry.filter }),
    };
}

export function entryTermsOf(rows: readonly RhydbRow[]): EntryTerms {
    let total = 0;
    let restricted = 0;
    for (const row of rows) {
        const n = Number(row.n ?? 0);
        total += n;
        if (row[COLUMNS.dataUseTerms] === RESTRICTED) {
            restricted += n;
        }
    }
    return { total, restricted };
}
