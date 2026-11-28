/** Count each filter's options with its own constraint omitted. */

import { combineQueryResults, readQueryData, type Loadable } from './queryResult.ts';
import { useManyRows, useRows } from './rhydbQuery.ts';
import type { Pathogen } from '../../domain/subject.ts';
import { accessionListQuery } from '../queries/accessionList.ts';
import { admin1ValuesQuery, groupAcross, valuesQuery } from '../queries/builders.ts';
import { COLUMNS, type ColumnCheck } from '../queries/columns.ts';
import { labelOf, levelsOf, type Dimension, type ValuesLookup } from '../queries/dimensions.ts';
import { compileSelection, PATHOGEN_TABLES, PERIOD, type Selection } from '../queries/selection.ts';
import type { Queryable } from '../transport/relation.ts';
import { readOptionalText, type RhydbRow } from '../transport/row.ts';

export type FilterValue = { value: string; label: string; n: number; depth: number };

export type Filter = { dimension: Dimension; values: FilterValue[]; total: number };

const collectionYearRangeQuery = groupAcross({
    tables: PATHOGEN_TABLES,
    filter: () => undefined,
    columns: [],
    aggregates: { first: { op: 'min', column: COLUMNS.lower }, last: { op: 'max', column: COLUMNS.lower } },
});

function collectionYears(rows: RhydbRow[]): string[] {
    const range = rows.at(0);
    if (range === undefined) {
        return [];
    }
    const first = readOptionalText(range, 'first');
    const last = readOptionalText(range, 'last');
    if (first === null || last === null) {
        return [];
    }
    const start = Number(first.slice(0, 4));
    const end = Number(last.slice(0, 4));
    return Array.from({ length: end - start + 1 }, (_, index) => String(start + index).padStart(4, '0'));
}

/** Wait for the column check so that the lookup asks only for subtype columns that the table has. */
export function useValuesLookup(
    pathogen: Pathogen | undefined,
    country: string | undefined,
    available: Loadable<ColumnCheck>,
    needsYearRange: boolean,
): Loadable<ValuesLookup> {
    const tables = PATHOGEN_TABLES;
    const countries = useRows(valuesQuery(tables, COLUMNS.country), 'Recorded countries');
    const hosts = useRows(
        groupAcross({ tables, filter: () => undefined, columns: [COLUMNS.host, COLUMNS.hostTaxon] }),
        'Recorded hosts',
    );
    const table = pathogen?.table;
    const hasColumn = available.data;
    const levels = pathogen === undefined || hasColumn === undefined ? [] : levelsOf(pathogen, hasColumn);
    const subtypes = useManyRows(
        table === undefined ? [] : levels.map((level) => valuesQuery([table], level.column)),
        'Recorded subtypes',
    );
    // Read division spellings only for the selected country.
    const provinces = useRows(
        country === undefined ? undefined : admin1ValuesQuery(tables, country),
        'Recorded provinces',
    );
    const years = useRows(needsYearRange ? collectionYearRangeQuery : undefined, 'Filters', collectionYears);
    const lookup = readQueryData<ValuesLookup>(() =>
        hasColumn === undefined ||
        countries.data === undefined ||
        hosts.data === undefined ||
        subtypes.data === undefined ||
        (country !== undefined && provinces.data === undefined) ||
        (needsYearRange && years.data === undefined)
            ? undefined
            : {
                  years: years.data,
                  countries: countries.data.map((row) => readOptionalText(row, COLUMNS.country)),
                  hosts: hosts.data.map((row) => ({
                      name: readOptionalText(row, COLUMNS.host),
                      taxon: readOptionalText(row, COLUMNS.hostTaxon),
                  })),
                  subtypes: Object.fromEntries(
                      levels.map((level, index) => [
                          level.column,
                          (subtypes.data?.[index] ?? []).map((row) => readOptionalText(row, level.column)),
                      ]),
                  ),
                  admin1Names: (provinces.data ?? []).map((row) => readOptionalText(row, COLUMNS.admin1)),
              },
    );
    return combineQueryResults(lookup.data, [available, countries, hosts, subtypes, provinces, years, lookup]);
}

type Reads = {
    selection: Selection;
    dimensions: readonly Dimension[];
    tables: readonly string[];
    lookup: ValuesLookup | undefined;
};

/** A selection that keeps no table has no rows, and needs no query to say so. */
const NO_TABLES = 'no tables';
const NO_ROWS: RhydbRow[] = [];

function queryFor(
    options: Reads & { skip?: string; columns: readonly string[]; perTable?: boolean },
): Queryable | typeof NO_TABLES | undefined {
    const { selection, dimensions, tables, lookup, skip, columns, perTable } = options;
    if (lookup === undefined) {
        return undefined;
    }
    const compiled = compileSelection({ selection, dimensions, tables, lookup, skip });
    return compiled.tables.length === 0
        ? NO_TABLES
        : // The timeline groups by the collection date range, which is tens of thousands of distinct values,
          // so short aliases keep large grouped responses compact.
          groupAcross({ tables: compiled.tables, filter: compiled.filter, columns, perTable, compact: true });
}

export function useFilters(reads: Reads): Loadable<Filter[]> {
    const { dimensions } = reads;
    const queries = dimensions.map((dimension) =>
        queryFor({ ...reads, skip: dimension.id, columns: dimension.columns, perTable: dimension.perTable }),
    );
    const result = useManyRows(
        queries.map((query) => (query === NO_TABLES ? undefined : query)),
        'Filters',
    );
    const data =
        result.data === undefined || queries.some((query) => query === undefined)
            ? undefined
            : dimensions.map((dimension, index) => filterFrom(dimension, result.data?.[index] ?? NO_ROWS));
    return combineQueryResults(data, [result]);
}

function filterFrom(dimension: Dimension, rows: readonly RhydbRow[]): Filter {
    const totals = new Map<string, number>();
    const labels = new Map<string, string>();
    let total = 0;
    for (const row of rows) {
        const n = Number(row.n ?? 0);
        if (n === 0) {
            continue;
        }
        // An entry contributes to every overlapping group it belongs to.
        for (const value of dimension.valuesOf?.(row) ?? [dimension.valueOf(row)]) {
            totals.set(value, (totals.get(value) ?? 0) + n);
            const label = dimension.labelFromRow?.(row);
            if (label !== undefined) {
                labels.set(value, label);
            }
        }
        total += n;
    }
    const values = [...totals.entries()].map(([value, n]) => ({
        value,
        label: labels.get(value) ?? labelOf(dimension, value),
        depth: dimension.depthOf?.(value) ?? 0,
        n,
    }));
    const order = dimension.order;
    values.sort(order === undefined ? (a, b) => b.n - a.n : (a, b) => order(a.value, b.value));
    return { dimension, values, total };
}

export function useCrossRows(
    reads: Reads & { rowDimension: Dimension; columnDimension: Dimension },
): Loadable<RhydbRow[]> {
    const { rowDimension, columnDimension } = reads;
    const columns = [...new Set([...rowDimension.columns, ...columnDimension.columns])];
    const query = queryFor({
        ...reads,
        columns,
        perTable: rowDimension.perTable === true || columnDimension.perTable === true,
    });
    return useRowsOf(query, 'Cross-tab');
}

function useRowsOf(query: Queryable | typeof NO_TABLES | undefined, label: string): Loadable<RhydbRow[]> {
    const result = useRows(query === NO_TABLES ? undefined : query, label);
    return combineQueryResults(query === NO_TABLES ? NO_ROWS : result.data, [result]);
}

/** Read accessions on demand because the query can return the entire selection. */
export function matrixAccessionListQuery(reads: Reads): Queryable | undefined {
    const { selection, dimensions, tables, lookup } = reads;
    if (lookup === undefined) {
        return undefined;
    }
    const compiled = compileSelection({ selection, dimensions, tables, lookup });
    return compiled.tables.length === 0 ? undefined : accessionListQuery(compiled.tables, compiled.filter);
}

export function useTimelineRows(reads: Reads): Loadable<RhydbRow[]> {
    return useRowsOf(queryFor({ ...reads, skip: PERIOD, columns: [COLUMNS.lower, COLUMNS.upper] }), 'Timeline');
}
