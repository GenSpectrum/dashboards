/** Build a RhyQL query by composing operations on a relation. */

import { Expr, field, numberLiteral, PRECEDENCE, record, renderArgs, set, type Args } from './expression.ts';
import type { RhydbRow } from './row.ts';

/** Queries with compact aliases may provide a decoder to restore the original column names. */
export type Queryable = { render(): string; decode?: (rows: readonly RhydbRow[]) => RhydbRow[] };

/** Map computed grouping expressions to named columns before grouping. */
export type GroupColumns = readonly string[];

type MutationOptions = {
    minProportion?: number;
    fields?: readonly string[];
};

export type Relation = Queryable & {
    filter(predicate: Expr | undefined): Relation;
    map(assignments: Readonly<Record<string, Expr>>): Relation;
    project(columns: readonly (Expr | string)[]): Relation;
    /** With no grouping columns, aggregate the entire relation as one group. */
    group(aggregates: Readonly<Record<string, Expr>>, columns?: GroupColumns): Relation;
    order(keys: readonly SortKey[]): Relation;
    limit(rows: number): Relation;
    mutations(options?: MutationOptions): Relation;
    aminoAcidMutations(options?: MutationOptions): Relation;
    schema(): Relation;
    pipe(name: string, args?: Args): Relation;
};

export function table(name: string): Relation {
    return relation(field(name).render());
}

/** Union inputs must have the same columns in the same order. */
export function unionall(parts: readonly Relation[]): Relation {
    if (parts.length === 0) {
        throw new Error('A union needs at least one part');
    }
    return parts.slice(1).reduce((union, part) => relation(`${union.render()}.unionall(${part.render()})`), parts[0]);
}

function relation(text: string): Relation {
    const pipe = (name: string, args?: Args): Relation => relation(`${text}.${name}(${renderArgs(args)})`);

    return {
        render: () => text,
        pipe,
        filter: (predicate) => (predicate === undefined ? relation(text) : pipe('filter', [predicate])),
        map: (assignments) => pipe('map', [record(assignments)]),
        project: (columns) => pipe('project', [set(columns.map(asExpr))]),
        group: (aggregates, columns) =>
            pipe('group', {
                by: columns === undefined || columns.length === 0 ? NO_COLUMNS : groupColumns(columns),
                aggs: record(aggregates),
            }),
        order: (keys) => pipe('order', { by: set(keys.map(sortKey)) }),
        limit: (rows) => pipe('limit', [count(rows)]),
        mutations: (options) => pipe('mutations', mutationArgs(options)),
        aminoAcidMutations: (options) => pipe('aminoAcidMutations', mutationArgs(options)),
        schema: () => pipe('schema'),
    };
}

export type SortKey = { column: string; descending?: boolean };

function sortKey(key: SortKey): Expr {
    const column = field(key.column);
    return key.descending === true ? new Expr(PRECEDENCE.postfix, `${column.render()}.desc()`) : column;
}

function count(rows: number): Expr {
    if (!Number.isInteger(rows) || rows < 1) {
        throw new Error(`Not a row count: ${rows}`);
    }
    return numberLiteral(rows);
}

/** RhyQL requires `by := {}` to group the entire relation. */
const NO_COLUMNS = new Expr(PRECEDENCE.atomic, '{}');

function groupColumns(columns: GroupColumns): Expr {
    return set(columns.map((name) => field(name)));
}

function asExpr(column: Expr | string): Expr {
    return typeof column === 'string' ? field(column) : column;
}

function mutationArgs(options: MutationOptions = {}): Args {
    const args: Record<string, Expr> = {};
    if (options.minProportion !== undefined) {
        args.minProportion = proportion(options.minProportion);
    }
    if (options.fields !== undefined) {
        args.fields = set(options.fields.map((name) => field(name)));
    }
    return args;
}

function proportion(value: number): Expr {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
        throw new Error(`Not a proportion in [0, 1]: ${value}`);
    }
    return numberLiteral(value);
}
