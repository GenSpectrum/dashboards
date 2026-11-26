import { COLUMNS, CURRENT_VERSION, type TableFilter } from './scope.ts';
import { allPathogens, subtypeColumns, type Catalog } from '../../domain/subject.ts';
import { field, str, type Expr } from '../transport/expression.ts';
import { count, countOf, max, min, sum } from '../transport/functions.ts';
import { table, unionall, type Limited, type Relation } from '../transport/relation.ts';
import type { RhydbRow } from '../transport/row.ts';

export const ORGANISM = 'organism';

export type Aggregate = { op: 'count' } | { op: 'countOf' | 'min' | 'max' | 'sum'; column: string };

export type Aggregates = Readonly<Record<string, Aggregate>>;

const COUNT: Aggregates = { n: { op: 'count' } };

function aggregateExpr(aggregate: Aggregate): Expr {
    switch (aggregate.op) {
        case 'count':
            return count();
        case 'countOf':
            return countOf(aggregate.column);
        case 'min':
            return min(aggregate.column);
        case 'max':
            return max(aggregate.column);
        case 'sum':
            return sum(aggregate.column);
    }
}

/** Combine per-table counts and sums by summing. Combine extremes with the same aggregate. */
function combineExpr(name: string, aggregate: Aggregate): Expr {
    switch (aggregate.op) {
        case 'count':
        case 'countOf':
        case 'sum':
            return sum(name);
        case 'min':
            return min(name);
        case 'max':
            return max(name);
    }
}

/** Apply the current-version filter to every table read. */
export function sequences(tableName: string): Relation {
    return table(tableName).filter(CURRENT_VERSION);
}

export function scoped(tableName: string, filter: TableFilter): Relation {
    return sequences(tableName).filter(filter(tableName));
}

export function groupAcross(options: {
    tables: readonly string[];
    filter: TableFilter;
    columns: readonly string[];
    aggregates?: Aggregates;
    perTable?: boolean;
    /** Use short aliases for grouping columns to reduce the size of NDJSON responses. */
    compact?: boolean;
}): Relation {
    const { tables, filter, columns, aggregates = COUNT, perTable = false, compact = false } = options;
    const aggregateNames = Object.keys(aggregates);
    const aggregateExprs = Object.fromEntries(
        Object.entries(aggregates).map(([name, aggregate]) => [name, aggregateExpr(aggregate)]),
    );
    const named = compact ? columns.map((_, index) => `${COLUMN_ALIAS}${index}`) : [...columns];
    const organism = compact ? TABLE_ALIAS : ORGANISM;
    const shorten = (name: string): Readonly<Record<string, Expr>> =>
        compact
            ? {
                  ...Object.fromEntries(columns.map((column, index) => [named[index], field(column)])),
                  [organism]: str(name),
              }
            : { [organism]: str(name) };
    const decode = compact ? decoder(columns, named, organism) : undefined;
    if (tables.length === 1 && !perTable) {
        const grouped = scoped(tables[0], filter).group(aggregateExprs, columns);
        return withDecoder(
            compact && columns.length > 0
                ? grouped
                      .map(Object.fromEntries(columns.map((column, index) => [named[index], field(column)])))
                      .project([...named, ...aggregateNames])
                : grouped,
            decode,
        );
    }
    const parts = tables.map((name) =>
        scoped(name, filter)
            .group(aggregateExprs, columns)
            .map(shorten(name))
            .project([...named, ...aggregateNames, organism]),
    );
    const union = unionall(parts);
    if (perTable) {
        return withDecoder(union, decode);
    }
    return withDecoder(
        union.group(
            Object.fromEntries(
                Object.entries(aggregates).map(([name, aggregate]) => [name, combineExpr(name, aggregate)]),
            ),
            named,
        ),
        decode,
    );
}

const COLUMN_ALIAS = 'c';
const TABLE_ALIAS = 'o';

export function compactly(
    relation: Relation,
    options: { rename: readonly string[]; keep: readonly string[] },
): Relation {
    const { rename, keep } = options;
    if (rename.length === 0) {
        return relation;
    }
    const named = rename.map((_, index) => `${COLUMN_ALIAS}${index}`);
    return withDecoder(
        relation
            .map(Object.fromEntries(rename.map((column, index) => [named[index], field(column)])))
            .project([...named, ...keep]),
        decoder(rename, named, TABLE_ALIAS),
    );
}

function withDecoder(relation: Relation, decode: Decoder | undefined): Relation {
    return decode === undefined ? relation : { ...relation, decode };
}

type Decoder = (rows: readonly RhydbRow[]) => RhydbRow[];

function decoder(columns: readonly string[], named: readonly string[], organism: string): Decoder {
    const names = new Map<string, string>(named.map((alias, index) => [alias, columns[index]]));
    names.set(organism, ORGANISM);
    return (rows) =>
        rows.map((row) =>
            Object.fromEntries(Object.entries(row).map(([key, value]) => [names.get(key) ?? key, value])),
        );
}

/** Rank and limit grouped values in RhyDB. */
export function rankedValuesQuery(options: {
    tables: readonly string[];
    filter: TableFilter;
    column: string;
    limit: number;
}): Limited {
    return groupAcross({ tables: options.tables, filter: options.filter, columns: [options.column] })
        .order(field('n').desc(), field(options.column))
        .limit(options.limit);
}

export function valueTotalsQuery(options: {
    tables: readonly string[];
    filter: TableFilter;
    column: string;
}): Relation {
    return groupAcross({ tables: options.tables, filter: options.filter, columns: [options.column] }).group({
        values: count(),
        total: sum('n'),
    });
}

export function dataUseTermsAcross(options: { tables: readonly string[]; filter: TableFilter }): Relation {
    return entriesAcross(options, [
        COLUMNS.accessionVersion,
        COLUMNS.dataUseTerms,
        COLUMNS.restrictedUntil,
        COLUMNS.termsUrl,
    ]);
}

function entriesAcross(
    options: { tables: readonly string[]; filter: TableFilter },
    columns: readonly string[],
): Relation {
    const parts = options.tables.map((name) => scoped(name, options.filter).project(columns));
    return unionall(parts);
}

export const SUMMARY: Aggregates = {
    n: { op: 'count' },
    lastReleased: { op: 'max', column: COLUMNS.released },
};

/** Exclude entries without collection dates because their upper bound can be the release date. */
export const COLLECTION_DATES: Aggregates = {
    firstCollectedFrom: { op: 'min', column: COLUMNS.lower },
    firstCollected: { op: 'min', column: COLUMNS.upper },
    lastCollected: { op: 'max', column: COLUMNS.lower },
    lastCollectedTo: { op: 'max', column: COLUMNS.upper },
};

export const MUTATION_FIELDS = [
    'mutationFrom',
    'mutationTo',
    'sequenceName',
    'position',
    'proportion',
    'coverage',
    'count',
];

/** Resolve the catalog's subtype columns against the table schemas. */
export function subtypeColumnsQuery(catalog: Catalog): Relation {
    const columns = [...new Set(subtypeColumns(catalog).map((need) => need.column))];
    const parts = allPathogens(catalog).map((pathogen) =>
        table(pathogen.table)
            .schema()
            .map({ [ORGANISM]: str(pathogen.table) })
            .project([ORGANISM, 'fieldName']),
    );
    return unionall(parts).filter(field('fieldName').isIn(columns.map(str)));
}

/** Reference sequence names are qualified as `<table>:<sequence>`. */
export function referenceGenomesQuery(): Relation {
    return table('reference_genomes').project(['name', 'type']);
}

export function valuesQuery(tables: readonly string[], column: string, filter: TableFilter = () => undefined) {
    return groupAcross({ tables, filter, columns: [column] });
}

export function admin1ValuesQuery(tables: readonly string[], country: string): Relation {
    return valuesQuery(tables, COLUMNS.admin1, () => field(COLUMNS.country).eq(str(country)));
}
