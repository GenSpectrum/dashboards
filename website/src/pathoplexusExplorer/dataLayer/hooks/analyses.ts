import { useMemo } from 'react';

import { useManyRows, useRows } from './rhydbQuery.ts';
import { placedCountryOf } from '../../domain/geography.ts';
import type { Hierarchy } from '../../domain/lineages.ts';
import { hasVariant, type Scope } from '../../domain/scope.ts';
import { subtypeColumns, subjectKey, type Catalog } from '../../domain/subject.ts';
import {
    breakdownNeeds,
    partsOf,
    resolveBreakdown,
    type BreakdownSpec,
    type ColumnCheck,
    type InstanceShape,
    type Part,
} from '../queries/breakdown.ts';
import {
    COLLECTION_DATES,
    groupAcross,
    ORGANISM,
    referenceGenomesQuery,
    subtypeColumnsQuery,
    SUMMARY,
    valuesQuery,
} from '../queries/builders.ts';
import { lineageDefinitionsQuery } from '../queries/definitions.ts';
import { hierarchyOf, resolveScopes, scopePlan, valuesOf, type ResolvedScope } from '../queries/resolve.ts';
import { COLUMNS, VariantError } from '../queries/scope.ts';
import { and, field } from '../transport/expression.ts';
import { isNotNull } from '../transport/functions.ts';
import type { Queryable } from '../transport/relation.ts';
import { readText, type RhydbRow } from '../transport/row.ts';

export type Loadable<T> = { data: T | undefined; isLoading: boolean; error: Error | null };

export function firstErrorOf(parts: readonly { error: Error | null }[]): Error | null {
    return parts.find((part) => part.error !== null)?.error ?? null;
}

/** Combine loading states and propagate the first error. */
export function merged<T>(
    data: T | undefined,
    parts: readonly { isLoading: boolean; error: Error | null }[],
): Loadable<T> {
    const error = firstErrorOf(parts);
    return {
        data: error === null ? data : undefined,
        isLoading: parts.some((part) => part.isLoading),
        error,
    };
}

export function useSubtypeColumns(catalog: Catalog): Loadable<Set<string>> {
    const query = subtypeColumnsQuery(catalog);
    const rows = useRows(query, 'Report bar');
    const found = rows.data;
    const data = useMemo(
        () =>
            found === undefined
                ? undefined
                : new Set(found.map((row) => `${readText(row, ORGANISM)}|${readText(row, 'fieldName')}`)),
        [found],
    );
    return merged(data, [rows]);
}

export function useScopeFilter(scope: Scope, catalog: Catalog): Loadable<ResolvedScope> {
    const many = useScopeFilters([scope], catalog);
    return { ...many, data: many.data?.[0] };
}

/** Fetch definitions for all subtype columns in one query. */
export function useLineageHierarchy(catalog: Catalog): Loadable<Hierarchy> {
    const query = useMemo(() => lineageDefinitionsQuery(subtypeColumns(catalog)), [catalog]);
    const rows = useRows(query, 'Lineage definitions');
    const found = rows.data;
    return useMemo(() => {
        if (found === undefined) {
            return { data: undefined, isLoading: rows.isLoading, error: rows.error };
        }
        try {
            return { data: hierarchyOf(found), isLoading: false, error: null };
        } catch (error) {
            return {
                data: undefined,
                isLoading: false,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    }, [found, rows.isLoading, rows.error]);
}

/** Resolve the shared lookups once for scopes that are compared. */
export function useScopeFilters(scopes: readonly Scope[], catalog: Catalog): Loadable<ResolvedScope[]> {
    const plan = scopePlan(scopes, catalog);
    const result = useManyRows(plan.queries, 'Scope');
    const hierarchy = useLineageHierarchy(catalog);
    const found = hierarchy.data;
    const key = JSON.stringify(scopes.map(scopeKeyOf));
    return useMemo(() => {
        if (result.data === undefined || found === undefined) {
            return {
                data: undefined,
                isLoading: result.isLoading || hierarchy.isLoading,
                error: result.error ?? hierarchy.error,
            };
        }
        const rows = result.data.map((entry) => entry ?? []);
        try {
            return { data: resolveScopes(plan, rows, found), isLoading: false, error: null };
        } catch (error) {
            if (error instanceof VariantError) {
                return { data: undefined, isLoading: false, error };
            }
            throw error;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by the scopes' content and the lookups
    }, [result.data, result.isLoading, result.error, found, hierarchy.isLoading, hierarchy.error, key]);
}

function scopeKeyOf(scope: Scope) {
    return {
        what: subjectKey(scope.what),
        where: scope.where,
        period: scope.period,
        variant: hasVariant(scope) ? scope.variant.trim() : undefined,
    };
}

export function useQueryOn(
    resolved: Loadable<ResolvedScope>,
    build: (scope: ResolvedScope) => Queryable | undefined,
    label: string,
): Loadable<RhydbRow[]> {
    const rows = useRows(resolved.data === undefined ? undefined : build(resolved.data), label);
    return merged(rows.data, [resolved, rows]);
}

export function countsBy(columns: readonly string[]) {
    return ({ tables, filter }: ResolvedScope) => groupAcross({ tables, filter, columns });
}

export type Summary = {
    perTable: {
        table: string;
        n: number;
        firstCollectedFrom: string | null;
        firstCollected: string | null;
        lastCollected: string | null;
        lastCollectedTo: string | null;
        lastReleased: string | null;
    }[];
    n: number;
    countries: number;
    groups: number;
    /** Aggregate each bound independently across all tables. The two bounds can come from different entries. */
    firstCollectedFrom: string | null;
    firstCollected: string | null;
    lastCollected: string | null;
    lastCollectedTo: string | null;
    lastReleased: string | null;
};

type PerTable = Summary['perTable'][number];

function earliestOf(rows: readonly PerTable[], column: keyof PerTable): string | null {
    return extremeOf(rows, column, (value, best) => value < best);
}

function latestOf(rows: readonly PerTable[], column: keyof PerTable): string | null {
    return extremeOf(rows, column, (value, best) => value > best);
}

function extremeOf(
    rows: readonly PerTable[],
    column: keyof PerTable,
    better: (value: string, best: string) => boolean,
): string | null {
    return rows.reduce<string | null>((best, row) => {
        const value = row[column];
        if (typeof value !== 'string') {
            return best;
        }
        return best === null || better(value, best) ? value : best;
    }, null);
}

export function useSummary(resolved: Loadable<ResolvedScope>): Loadable<Summary> {
    const scope = resolved.data;
    const perTable = useQueryOn(
        resolved,
        ({ tables, filter }) => groupAcross({ tables, filter, columns: [], aggregates: SUMMARY, perTable: true }),
        'Headline numbers',
    );
    // Exclude entries without a collection date because their upper bound can be the release date.
    const dated = useQueryOn(
        resolved,
        ({ tables, filter }) =>
            groupAcross({
                tables,
                filter: (table) => and(filter(table), isNotNull(field(COLUMNS.lower))),
                columns: [],
                aggregates: COLLECTION_DATES,
                perTable: true,
            }),
        'Headline numbers',
    );
    const countries = useQueryOn(resolved, countsBy([COLUMNS.country]), 'Headline numbers');
    const groups = useQueryOn(resolved, countsBy([COLUMNS.group]), 'Headline numbers');
    const data = useMemo((): Summary | undefined => {
        if (
            perTable.data === undefined ||
            dated.data === undefined ||
            countries.data === undefined ||
            groups.data === undefined
        ) {
            return undefined;
        }
        const datesOf = (table: string) =>
            dated.data?.find((row) => String(row.organism ?? scope?.tables[0]) === table);
        const rows = perTable.data.map((row) => {
            const table = String(row.organism ?? scope?.tables[0]);
            const dates = datesOf(table);
            return {
                table,
                n: Number(row.n),
                firstCollectedFrom: (dates?.firstCollectedFrom ?? null) as string | null,
                firstCollected: (dates?.firstCollected ?? null) as string | null,
                lastCollected: (dates?.lastCollected ?? null) as string | null,
                lastCollectedTo: (dates?.lastCollectedTo ?? null) as string | null,
                lastReleased: (row.lastReleased ?? null) as string | null,
            };
        });
        return {
            perTable: rows,
            n: rows.reduce((sum, row) => sum + row.n, 0),
            firstCollectedFrom: earliestOf(rows, 'firstCollectedFrom'),
            firstCollected: earliestOf(rows, 'firstCollected'),
            lastCollected: latestOf(rows, 'lastCollected'),
            lastCollectedTo: latestOf(rows, 'lastCollectedTo'),
            lastReleased: latestOf(rows, 'lastReleased'),
            countries: new Set(
                countries.data
                    .filter((row) => Number(row.n) > 0)
                    .map((row) => placedCountryOf(row[COLUMNS.country]))
                    .filter((country) => country !== undefined),
            ).size,
            groups: groups.data.filter((row) => row[COLUMNS.group] !== null && Number(row.n) > 0).length,
        };
    }, [perTable.data, dated.data, countries.data, groups.data, scope]);
    return merged(data, [perTable, dated, countries, groups]);
}

export function useBreakdownSpec(
    scope: Scope,
    catalog: Catalog,
    /** Wait for schema information before querying a subtype column. */
    columns?: Loadable<ColumnCheck>,
): Loadable<BreakdownSpec> {
    const hierarchy = useLineageHierarchy(catalog);
    const has = columns?.data;
    const found = hierarchy.data;
    const waiting = (columns !== undefined && has === undefined && columns.error === null) || found === undefined;
    const shape: InstanceShape | undefined = useMemo(
        () => (found === undefined ? undefined : { has: has ?? (() => true), hierarchy: found }),
        [has, found],
    );
    const need = shape === undefined ? undefined : breakdownNeeds(scope, shape);
    const values = useRows(need === undefined ? undefined : valuesQuery([need.table], need.column), 'Breakdown');
    const data = useMemo(() => {
        if (waiting || shape === undefined || (need !== undefined && values.data === undefined)) {
            return undefined;
        }
        return resolveBreakdown(
            scope,
            catalog,
            shape,
            need === undefined || values.data === undefined ? undefined : valuesOf(values.data, need.column),
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by the scope's content
    }, [JSON.stringify(scopeKeyOf(scope)), values.data, need?.table, need?.column, shape, waiting]);
    return merged(data, columns === undefined ? [values, hierarchy] : [values, columns, hierarchy]);
}

export function useBreakdown(resolved: Loadable<ResolvedScope>, spec: Loadable<BreakdownSpec>): Loadable<Part[]> {
    const specData = spec.data;
    const result = useQueryOn(
        resolved,
        ({ tables, filter }) =>
            specData === undefined
                ? undefined
                : groupAcross({ tables, filter, columns: specData.columns, perTable: specData.perTable }),
        'Breakdown',
    );
    const data = useMemo(
        () => (result.data === undefined || specData === undefined ? undefined : partsOf(result.data, specData)),
        [result.data, specData],
    );
    return merged(data, [spec, result]);
}

export function useOverTimeRows(resolved: Loadable<ResolvedScope>, spec: BreakdownSpec | undefined) {
    return useQueryOn(
        resolved,
        ({ tables, filter }) =>
            spec === undefined
                ? undefined
                : groupAcross({
                      tables,
                      filter,
                      columns: [...spec.columns, COLUMNS.lower, COLUMNS.upper],
                      perTable: spec.perTable,
                      // Alias columns because a grouped date query can return many distinct ranges.
                      compact: true,
                  }),
        'Over time',
    );
}

export function useMapCounts(
    scope: Scope,
    resolved: Loadable<ResolvedScope>,
    parent: Loadable<ResolvedScope> | undefined,
): Loadable<{ rows: RhydbRow[]; parentRows: RhydbRow[] | undefined }> {
    const columns =
        scope.where.level === 'country' || scope.where.level === 'admin1'
            ? [COLUMNS.country, COLUMNS.admin1]
            : [COLUMNS.country];
    const build = countsBy(columns);
    const own = useQueryOn(resolved, build, 'Map');
    const above = useQueryOn(resolved.data === undefined ? resolved : (parent ?? EMPTY), build, 'Map');
    const data =
        own.data === undefined || (parent !== undefined && above.data === undefined)
            ? undefined
            : { rows: own.data, parentRows: above.data };
    return merged(data, [own, above]);
}

const EMPTY: Loadable<ResolvedScope> = { data: undefined, isLoading: false, error: null };

export function useHostCounts(resolved: Loadable<ResolvedScope>): Loadable<RhydbRow[]> {
    return useQueryOn(resolved, countsBy([COLUMNS.host, COLUMNS.hostTaxon]), 'Hosts');
}

export function useReferenceGenomes(): Loadable<RhydbRow[]> {
    return useRows(referenceGenomesQuery(), 'Mutations');
}
