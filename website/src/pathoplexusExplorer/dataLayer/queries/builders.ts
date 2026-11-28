import { COLUMNS, CURRENT_VERSION } from './columns.ts';
import type { TableFilter } from './scope.ts';
import { countryNamesOf } from '../../domain/countries.ts';
import { allPathogens, subtypeColumns, type Catalog } from '../../domain/subject.ts';
import { field, str, type Expr } from '../transport/expression.ts';
import { count, countOf, max, min, sum } from '../transport/functions.ts';
import { table, unionall, type Limited, type Relation } from '../transport/relation.ts';
import { RhydbRowError, type RhydbRow } from '../transport/row.ts';

export const ORGANISM = 'organism';

export type Aggregate = { op: 'count' } | { op: 'countOf' | 'min' | 'max' | 'sum'; column: string };

export type Aggregates = Readonly<Record<string, Aggregate>>;

const COUNT: Aggregates = { n: { op: 'count' } };

const aggregateFunctions = { countOf, min, max, sum };

function aggregateExpr(aggregate: Aggregate): Expr {
    return aggregate.op === 'count' ? count() : aggregateFunctions[aggregate.op](aggregate.column);
}

/** Per-table counts and sums add up. Date bounds keep the original minimum or maximum. */
function combineExpr(name: string, { op }: Aggregate): Expr {
    return op === 'min' || op === 'max' ? aggregateFunctions[op](name) : sum(name);
}

/** Apply the current-version filter to every table read. */
export function sequences(tableName: string, filter?: TableFilter): Relation {
    return table(tableName).filter(CURRENT_VERSION).filter(filter?.(tableName));
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
    const parts = tables.map((name) => {
        const grouped = sequences(name, filter).group(aggregateExprs, columns);
        return perTable ? grouped.map({ [ORGANISM]: str(name) }) : grouped;
    });
    let grouped = unionall(parts);
    if (tables.length > 1 && !perTable) {
        const totals = Object.fromEntries(
            Object.entries(aggregates).map(([name, aggregate]) => [name, combineExpr(name, aggregate)]),
        );
        grouped = grouped.group(totals, columns);
    }
    return compact
        ? compactly(grouped, { rename: perTable ? [...columns, ORGANISM] : columns, keep: aggregateNames })
        : grouped;
}

/** Shorten names only in the response sent over HTTP. Aggregation uses the schema's column names. */
export function compactly(
    relation: Relation,
    { rename, keep }: { rename: readonly string[]; keep: readonly string[] },
): Relation {
    if (rename.length === 0) {
        return relation;
    }
    const columns = Object.fromEntries(rename.map((name, index) => [name === ORGANISM ? 'o' : `c${index}`, name]));
    const aliases = Object.fromEntries(Object.entries(columns).map(([alias, name]) => [alias, field(name)]));
    const fields = [...Object.entries(columns), ...keep.map((name) => [name, name])];
    return {
        ...relation.map(aliases).project([...Object.keys(aliases), ...keep]),
        decode: (rows) =>
            rows.map((row) => {
                const decoded: RhydbRow = {};
                for (const [alias, name] of fields) {
                    const value = row[alias];
                    if (value === undefined) {
                        throw new RhydbRowError(name, 'missing from the response');
                    }
                    if (name === 'n' && (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)) {
                        throw new RhydbRowError(name, 'expected a nonnegative sequence count');
                    }
                    decoded[name] = value;
                }
                return decoded;
            }),
    };
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
    const names = countryNamesOf(country);
    return valuesQuery(tables, COLUMNS.admin1, () => field(COLUMNS.country).isIn(names.map(str)));
}
