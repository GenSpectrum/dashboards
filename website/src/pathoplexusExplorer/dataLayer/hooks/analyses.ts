import { useMemo } from 'react';

import { combineQueryResults, readQueryData, type Loadable } from './queryResult.ts';
import { useManyRows, useRows } from './rhydbQuery.ts';
import { reportPeriod } from '../../domain/dates.ts';
import type { Place } from '../../domain/geography.ts';
import type { Hierarchy } from '../../domain/lineages.ts';
import { hasVariant, type Scope } from '../../domain/scope.ts';
import { subtypeColumns, subjectKey, type Catalog } from '../../domain/subject.ts';
import {
    breakdownNeeds,
    partsOf,
    resolveBreakdown,
    type BreakdownSpec,
    type InstanceShape,
    type Part,
} from '../queries/breakdown.ts';
import { groupAcross, ORGANISM, referenceGenomesQuery, subtypeColumnsQuery, valuesQuery } from '../queries/builders.ts';
import { COLUMNS, type ColumnCheck } from '../queries/columns.ts';
import { lineageDefinitionsQuery } from '../queries/definitions.ts';
import { hierarchyOf, scopePlan, valuesOf, type ResolvedScope } from '../queries/resolve.ts';
import type { Queryable } from '../transport/relation.ts';
import { readText, type RhydbRow } from '../transport/row.ts';

function columnCheck(rows: RhydbRow[]): ColumnCheck {
    const columns = new Set(rows.map((row) => `${readText(row, ORGANISM)}|${readText(row, 'fieldName')}`));
    return (table, column) => columns.has(`${table}|${column}`);
}

export function useSubtypeColumns(catalog: Catalog): Loadable<ColumnCheck> {
    const query = useMemo(() => subtypeColumnsQuery(catalog), [catalog]);
    return useRows(query, 'Report bar', columnCheck);
}

export function useScopeFilter(scope: Scope, catalog: Catalog): Loadable<ResolvedScope> {
    const many = useScopeFilters([scope], catalog);
    return { ...many, data: many.data?.[0] };
}

/** Fetch definitions for all subtype columns in one query. */
export function useLineageHierarchy(catalog: Catalog): Loadable<Hierarchy> {
    const query = useMemo(() => lineageDefinitionsQuery(subtypeColumns(catalog)), [catalog]);
    return useRows(query, 'Lineage definitions', hierarchyOf);
}

/** Resolve the shared lookups once for scopes that are compared. */
export function useScopeFilters(scopes: readonly Scope[], catalog: Catalog): Loadable<ResolvedScope[]> {
    const key = JSON.stringify(scopes.map(scopeKeyOf));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the key covers each scope's filter inputs
    const plan = useMemo(() => scopePlan(scopes, catalog), [key, catalog]);
    const result = useManyRows(plan.queries, 'Scope');
    const hierarchy = useLineageHierarchy(catalog);
    const rows = result.data;
    const found = hierarchy.data;
    const resolved = useMemo(
        () =>
            readQueryData(() => {
                if (rows === undefined || found === undefined) return undefined;
                return plan.resolve(
                    rows.map((entry) => entry ?? []),
                    found,
                );
            }),
        [rows, found, plan],
    );
    return combineQueryResults(resolved.data, [result, hierarchy, resolved]);
}

function scopeKeyOf(scope: Scope) {
    return {
        what: subjectKey(scope.what),
        except: scope.except === undefined ? undefined : subjectKey(scope.except),
        where: scope.where,
        period: reportPeriod(scope.period),
        variant: hasVariant(scope) ? scope.variant.trim() : undefined,
    };
}

export function useQueryOn(
    resolved: Loadable<ResolvedScope>,
    build: (scope: ResolvedScope) => Queryable | undefined,
    label: string,
): Loadable<RhydbRow[]> {
    const rows = useRows(resolved.data === undefined ? undefined : build(resolved.data), label);
    return combineQueryResults(rows.data, [resolved, rows]);
}

export function countsBy(columns: readonly string[]) {
    return ({ tables, filter }: ResolvedScope) => groupAcross({ tables, filter, columns });
}

export function useBreakdownSpec(
    scope: Scope,
    catalog: Catalog,
    /** Wait for schema information before querying a subtype column. */
    columns: Loadable<ColumnCheck>,
): Loadable<BreakdownSpec> {
    const hierarchy = useLineageHierarchy(catalog);
    const has = columns.data;
    const found = hierarchy.data;
    const shape: InstanceShape | undefined = useMemo(
        () => (has === undefined || found === undefined ? undefined : { has, hierarchy: found }),
        [has, found],
    );
    const need = useMemo(() => (shape === undefined ? undefined : breakdownNeeds(scope, shape)), [scope, shape]);
    const values = useRows(
        need === undefined ? undefined : valuesQuery([need.table], need.column),
        'Breakdown',
        (rows) => (need === undefined ? undefined : valuesOf(rows, need.column)),
    );
    const data = useMemo(
        () =>
            shape === undefined || (need !== undefined && values.data === undefined)
                ? undefined
                : resolveBreakdown(scope, catalog, shape, values.data),
        [scope, catalog, values.data, need, shape],
    );
    return combineQueryResults(data, [values, columns, hierarchy]);
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
        () =>
            result.data === undefined || specData === undefined
                ? undefined
                : partsOf(result.data, specData).filter((part) => part.n > 0),
        [result.data, specData],
    );
    return combineQueryResults(data, [spec, result]);
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
    where: Place,
    resolved: Loadable<ResolvedScope>,
    parent?: Loadable<ResolvedScope>,
): Loadable<{ rows: RhydbRow[]; parentRows: RhydbRow[] | undefined }> {
    const columns =
        where.level === 'country' || where.level === 'admin1' ? [COLUMNS.country, COLUMNS.admin1] : [COLUMNS.country];
    const build = countsBy(columns);
    const own = useQueryOn(resolved, build, 'Map');
    const above = useQueryOn(resolved.data === undefined ? resolved : (parent ?? EMPTY), build, 'Map');
    const data =
        own.data === undefined || (parent !== undefined && above.data === undefined)
            ? undefined
            : { rows: own.data, parentRows: above.data };
    return combineQueryResults(data, [own, above]);
}

const EMPTY: Loadable<ResolvedScope> = { data: undefined, isLoading: false, error: null };

export function useReferenceGenomes(): Loadable<RhydbRow[]> {
    return useRows(referenceGenomesQuery(), 'Mutations');
}
