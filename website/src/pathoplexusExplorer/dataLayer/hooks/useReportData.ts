import { useMemo } from 'react';

import {
    countsBy,
    useBreakdown,
    useBreakdownSpec,
    useMapCounts,
    useOverTimeRows,
    useQueryOn,
    useScopeFilter,
    useSubtypeColumns,
} from './analyses.ts';
import { firstErrorOf, combineQueryResults, type Loadable } from './queryResult.ts';
import type { Scope } from '../../domain/scope.ts';
import type { Catalog } from '../../domain/subject.ts';
import { METADATA_FIELDS } from '../../mappingData/metadataFields.ts';
import type { BreakdownSpec } from '../queries/breakdown.ts';
import { groupAcross, rankedValuesQuery, valueTotalsQuery } from '../queries/builders.ts';
import { COLUMNS } from '../queries/columns.ts';
import type { ResolvedScope } from '../queries/resolve.ts';
import { summaryOf } from '../queries/summary.ts';
import type { RhydbRow } from '../transport/row.ts';

export function availabilityKey(index: number): string {
    return `field${index}`;
}

/** Counts non-null fields in one grouped query. Placeholders count as recorded here. */
function useMetadataAvailability(resolved: Loadable<ResolvedScope>): Loadable<RhydbRow[]> {
    return useQueryOn(
        resolved,
        ({ tables, filter }) =>
            groupAcross({
                tables,
                filter,
                columns: [],
                aggregates: {
                    n: { op: 'count' },
                    ...Object.fromEntries(
                        METADATA_FIELDS.map((field, index) => [
                            availabilityKey(index),
                            { op: 'countOf', column: field.column } as const,
                        ]),
                    ),
                },
            }),
        'Metadata availability',
    );
}

export const CREDITS_SHOWN = 5;

export type RankedValues = {
    rows: RhydbRow[];
    values: number;
    total: number;
};

/** Fetch the ranked rows and totals separately to calculate the Other row without reading the full table. */
function useRankedValues(resolved: Loadable<ResolvedScope>, column: string, label: string): Loadable<RankedValues> {
    const top = useQueryOn(
        resolved,
        ({ tables, filter }) => rankedValuesQuery({ tables, filter, column, limit: CREDITS_SHOWN }),
        label,
    );
    const totals = useQueryOn(resolved, ({ tables, filter }) => valueTotalsQuery({ tables, filter, column }), label);
    const summed = totals.data?.[0];
    const data =
        top.data === undefined || summed === undefined
            ? undefined
            : { rows: top.data, values: Number(summed.values ?? 0), total: Number(summed.total ?? 0) };
    return combineQueryResults(data, [top, totals]);
}

export function useReportMetadata(resolved: Loadable<ResolvedScope>) {
    const hosts = useQueryOn(resolved, countsBy([COLUMNS.host, COLUMNS.hostTaxon]), 'Hosts');
    const groups = useQueryOn(resolved, countsBy([COLUMNS.group, COLUMNS.groupName]), 'Submitting groups');
    const authors = useRankedValues(resolved, COLUMNS.authors, 'Authors');
    const affiliations = useRankedValues(resolved, COLUMNS.affiliations, 'Author affiliations');
    const availability = useMetadataAvailability(resolved);
    return { hosts, groups, authors, affiliations, availability };
}

export type ReportMetadata = ReturnType<typeof useReportMetadata>;
export type ReportData = ReturnType<typeof useReportData>;

export function useReportData(scope: Scope, catalog: Catalog, override?: BreakdownSpec) {
    const resolved = useScopeFilter(scope, catalog);
    const columns = useSubtypeColumns(catalog);
    const fromTree = useBreakdownSpec(scope, catalog, columns);
    const spec: Loadable<BreakdownSpec> =
        override === undefined ? fromTree : { ...fromTree, data: override, isLoading: false, error: null };
    const breakdown = useBreakdown(resolved, spec);
    const overTime = useOverTimeRows(resolved, spec.data);
    const map = useMapCounts(scope.where, resolved);
    const metadata = useReportMetadata(resolved);
    const places = map.data?.rows;
    const groups = metadata.groups.data;
    const counts = useMemo(
        () => (places === undefined || groups === undefined ? undefined : summaryOf(places, groups)),
        [places, groups],
    );
    const summary = combineQueryResults(counts, [map, metadata.groups]);
    return { resolved, summary, spec, breakdown, overTime, map, ...metadata };
}

export function firstError(data: ReportData): Error | null {
    return firstErrorOf(Object.values(data));
}
