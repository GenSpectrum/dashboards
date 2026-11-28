/**
 * The RhyQL relation pipeline: a table, and the operations applied to it.
 *
 * Each step returns a new relation, so a query is built by naming what happens
 * to the rows. `limit()` ends the pipeline: what it returns can be sent but not
 * piped further.
 */

import { Expr, field, int, num, PRECEDENCE, record, renderArgs, set, type Args } from './expression.ts';
import type { RhydbRow } from './row.ts';

/**
 * Anything that can be sent. A query that asks for compact column names carries
 * the `decode` that gives the rows back their original names.
 */
export type Queryable = { render(): string; decode?: (rows: readonly RhydbRow[]) => RhydbRow[] };

/**
 * Grouping columns, by name: `{sampleId, batchId}`.
 *
 * The instance takes only names here, so a computed column is `map()`-ed first
 * and then grouped by its name.
 */
export type GroupColumns = readonly string[];

export type MutationOptions = {
    minProportion?: number;
    /** Result fields to keep. Trimming these is what keeps a mutation payload small. */
    fields?: readonly string[];
};

/** A pipeline that a limit has already ended. */
export type Limited = Queryable;

export type Relation = Queryable & {
    /** Narrowed, or returned unchanged where there is nothing to narrow by. */
    filter(predicate: Expr | undefined): Relation;
    map(assignments: Readonly<Record<string, Expr>>): Relation;
    project(columns: readonly (Expr | string)[]): Relation;
    /** Aggregates per group of `columns`; without columns, over the whole relation. */
    group(aggregates: Readonly<Record<string, Expr>>, columns?: GroupColumns): Relation;
    order(...keys: readonly Expr[]): Relation;
    /** Rows to keep. Ends the pipeline. */
    limit(count: number): Limited;
    mutations(options?: MutationOptions): Relation;
    aminoAcidMutations(options?: MutationOptions): Relation;
    /** The columns that the instance holds, and their types. */
    schema(): Relation;
};

/** The root of every query: the table, by name. */
export function table(name: string): Relation {
    return relation(field(name).render());
}

/**
 * The rows of every part, one after the other: `a.unionall(b).unionall(c)`. The parts must have the
 * same columns, in the same order.
 */
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
        filter: (predicate) => (predicate === undefined ? relation(text) : pipe('filter', [predicate])),
        map: (assignments) => pipe('map', [record(assignments)]),
        project: (columns) => pipe('project', [set(columns.map(asExpr))]),
        group: (aggregates, columns) =>
            pipe('group', {
                by: columns === undefined || columns.length === 0 ? NO_COLUMNS : groupColumns(columns),
                aggs: record(aggregates),
            }),
        order: (...keys) => pipe('order', { by: set(keys) }),
        limit: (count) => {
            if (!Number.isInteger(count) || count < 1) {
                throw new Error(`Not a row limit: ${count}`);
            }
            return pipe('limit', [int(count)]);
        },
        mutations: (options) => pipe('mutations', mutationArgs(options)),
        aminoAcidMutations: (options) => pipe('aminoAcidMutations', mutationArgs(options)),
        schema: () => pipe('schema'),
    };
}

/** `by := {}`: one group, the whole relation. `group` requires `by`, so it is spelled out. */
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

/** A share of the reads, which the operation requires to be in [0, 1]. */
function proportion(value: number): Expr {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
        throw new Error(`Not a proportion in [0, 1]: ${value}`);
    }
    return num(value);
}
