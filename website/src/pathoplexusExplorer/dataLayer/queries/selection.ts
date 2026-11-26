import { NOTHING, type Dimension, type ValuesLookup } from './dimensions.ts';
import { dateFilter, type TableFilter } from './scope.ts';
import type { Period } from '../../domain/scope.ts';
import { canQuote } from '../transport/escape.ts';
import { and, not } from '../transport/expression.ts';

export type Constraint = { values: readonly string[]; exclude?: boolean };

export type Constraints = Readonly<Record<string, Constraint | undefined>>;

export type Selection = { dimensions: Constraints; period: Period };

/** A value must be one that the dimension accepts, and one that a query can name. */
export function acceptedValues(dimension: Dimension, values: readonly string[]): readonly string[] {
    const accepts = dimension.accepts ?? (() => true);
    return values.filter((value) => (value === NOTHING || canQuote(value)) && accepts(value));
}

/** The table-choosing dimensions, which decide whether a single pathogen and so its subtype filters are in scope. */
const TABLE_DIMENSION_IDS = new Set(['pathogen', 'pathogenGroup']);

/**
 * Omitting a pathogen or pathogen-group filter also omits subtype filters specific to the pathogen that it kept, and
 * omitting the country filter omits the province filter, which names the divisions of that country.
 */
function isSkipped(id: string, skip: string | undefined): boolean {
    return (
        id === skip ||
        (skip !== undefined && TABLE_DIMENSION_IDS.has(skip) && id.startsWith('level:')) ||
        (skip === 'country' && id === 'admin1')
    );
}

/** Omit the collection period when loading the timeline so it can be widened. */
export const PERIOD = 'period';

/** The tables that the table-choosing dimensions keep. Both the page and the queries use this rule. */
export function tablesInScope(options: {
    constraints: Constraints;
    dimensions: readonly Dimension[];
    tables: readonly string[];
    skip?: string;
}): string[] {
    const { constraints, dimensions, skip } = options;
    let tables = [...options.tables];
    for (const dimension of dimensions) {
        const constraint = constraints[dimension.id];
        const values = constraint === undefined ? [] : acceptedValues(dimension, constraint.values);
        if (dimension.tablesOf === undefined || values.length === 0 || isSkipped(dimension.id, skip)) {
            continue;
        }
        const kept = dimension.tablesOf(values, tables);
        tables = constraint?.exclude === true ? tables.filter((table) => !kept.includes(table)) : kept;
    }
    return tables;
}

/** Compile the selected tables and row predicates. Omit one dimension when counting options for that filter. */
export function compileSelection(options: {
    selection: Selection;
    dimensions: readonly Dimension[];
    tables: readonly string[];
    lookup: ValuesLookup;
    skip?: string;
}): { tables: string[]; filter: TableFilter } {
    const { selection, dimensions, lookup, skip } = options;
    const tables = tablesInScope({ constraints: selection.dimensions, dimensions, tables: options.tables, skip });
    const parts = [];
    for (const dimension of dimensions) {
        const constraint = selection.dimensions[dimension.id];
        const values = constraint === undefined ? [] : acceptedValues(dimension, constraint.values);
        if (
            constraint === undefined ||
            values.length === 0 ||
            isSkipped(dimension.id, skip) ||
            dimension.tablesOf !== undefined
        ) {
            continue;
        }
        const expression = dimension.filterOf?.(values, lookup);
        if (expression !== undefined) {
            parts.push(constraint.exclude === true ? not(expression) : expression);
        }
    }
    const period = skip === PERIOD ? undefined : dateFilter(selection.period);
    const filter = and(...parts, period);
    return { tables, filter: () => filter };
}
