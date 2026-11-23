import { useMemo } from 'react';

import { locate, type Catalog } from '../domain/subject.ts';
import { METADATA_FIELDS } from '../mappingData/metadataFields.ts';
import type { Part, BreakdownSpec, ColumnCheck } from '../rhydb/breakdown.ts';
import {
    countsBy,
    firstErrorOf,
    merged,
    useBreakdown,
    useBreakdownSpec,
    useHostCounts,
    useMapCounts,
    useOverTimeRows,
    useQueryOn,
    useScopeFilter,
    useSubtypeColumns,
    useSummary,
    type Loadable,
    type Summary,
} from '../rhydb/hooks/analyses.ts';
import { groupAcross, rankedValuesQuery, valueTotalsQuery, ORGANISM } from '../rhydb/queries/builders.ts';
import type { ResolvedScope } from '../rhydb/queries/resolve.ts';
import { COLUMNS, type Scope } from '../rhydb/queries/scope.ts';
import type { RhydbRow } from '../rhydb/transport/row.ts';

export function useSubmittingGroups(resolved: Loadable<ResolvedScope>): Loadable<RhydbRow[]> {
    return useQueryOn(resolved, countsBy([COLUMNS.group, COLUMNS.groupName]), 'Submitting groups');
}

export function availabilityKey(index: number): string {
    return `field${index}`;
}

/** Counts non-null fields in one grouped query. Placeholders count as recorded here. */
export function useMetadataAvailability(resolved: Loadable<ResolvedScope>): Loadable<RhydbRow[]> {
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
function useRankedValues(
    resolved: Loadable<ResolvedScope>,
    column: string,
    label: string,
    limit = CREDITS_SHOWN,
): Loadable<RankedValues> {
    const top = useQueryOn(
        resolved,
        ({ tables, filter }) => rankedValuesQuery({ tables, filter, column, limit }),
        label,
    );
    const totals = useQueryOn(resolved, ({ tables, filter }) => valueTotalsQuery({ tables, filter, column }), label);
    const summed = totals.data?.[0];
    const data =
        top.data === undefined || summed === undefined
            ? undefined
            : { rows: top.data, values: Number(summed.values ?? 0), total: Number(summed.total ?? 0) };
    return merged(data, [top, totals]);
}

export function useAuthors(resolved: Loadable<ResolvedScope>): Loadable<RankedValues> {
    return useRankedValues(resolved, COLUMNS.authors, 'Authors');
}

export function useAffiliations(resolved: Loadable<ResolvedScope>): Loadable<RankedValues> {
    return useRankedValues(resolved, COLUMNS.affiliations, 'Author affiliations');
}

export type Basics = {
    resolved: Loadable<ResolvedScope>;
    summary: Loadable<Summary>;
    spec: Loadable<BreakdownSpec>;
    breakdown: Loadable<Part[]>;
    overTime: Loadable<RhydbRow[]>;
    map: Loadable<{ rows: RhydbRow[]; parentRows: RhydbRow[] | undefined }>;
    hosts: Loadable<RhydbRow[]>;
    groups: Loadable<RhydbRow[]>;
    authors: Loadable<RankedValues>;
    affiliations: Loadable<RankedValues>;
    availability: Loadable<RhydbRow[]>;
};

export function useReportBasics(scope: Scope, catalog: Catalog, override?: BreakdownSpec): Basics {
    const resolved = useScopeFilter(scope, catalog);
    const summary = useSummary(resolved);
    const available = useSubtypeColumns(catalog);
    const names = available.data;
    const columns: Loadable<ColumnCheck> = useMemo(
        () => ({
            ...available,
            data: names === undefined ? undefined : (table, column) => names.has(`${table}|${column}`),
        }),
        [available, names],
    );
    const fromTree = useBreakdownSpec(scope, catalog, columns);
    const spec: Loadable<BreakdownSpec> =
        override === undefined ? fromTree : { ...fromTree, data: override, isLoading: false, error: null };
    const counted = useBreakdown(resolved, spec);
    // Skip empty groups returned by per-table aggregation.
    const breakdown: Loadable<Part[]> = {
        ...counted,
        data: counted.data?.filter((part) => part.n > 0),
    };
    const overTime = useOverTimeRows(resolved, spec.data);
    const map = useMapCounts(scope, resolved, undefined);
    const hosts = useHostCounts(resolved);
    const groups = useSubmittingGroups(resolved);
    const authors = useAuthors(resolved);
    const affiliations = useAffiliations(resolved);
    const availability = useMetadataAvailability(resolved);
    return { resolved, summary, spec, breakdown, overTime, map, hosts, groups, authors, affiliations, availability };
}

export function firstError(basics: Basics): Error | null {
    return firstErrorOf(Object.values(basics));
}

export { COLUMNS };

/** Location reports group by individual pathogen. */
export function pathogenBreakdown(catalog: Catalog): BreakdownSpec {
    const found = (table: string) => locate(catalog, table);
    return {
        of: 'pathogen',
        title: 'Pathogen',
        through: [],
        columns: [],
        perTable: true,
        classify: (row) => String(row[ORGANISM] ?? ''),
        label: (key) => found(key)?.pathogen.label ?? key,
        target: (key) => {
            const place = found(key);
            return place === undefined
                ? undefined
                : { what: { kind: 'pathogen', pathogen: place.pathogen, family: place.family, group: place.group } };
        },
    };
}
