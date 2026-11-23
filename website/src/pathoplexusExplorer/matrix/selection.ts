import { NOTHING, type Dimension, type ValuesLookup } from './dimensions.ts';
import { decodedValue } from '../domain/text.ts';
import type { Period } from '../reports/kinds.ts';
import { dateFilter, type TableFilter } from '../rhydb/queries/scope.ts';
import { canQuote } from '../rhydb/transport/escape.ts';
import { and, not } from '../rhydb/transport/expression.ts';

export type Constraint = { values: readonly string[]; exclude?: boolean };

export type Constraints = Readonly<Record<string, Constraint | undefined>>;

export type Selection = { dimensions: Constraints; period: Period };

const NOTHING_TOKEN = '(none)';

export function parseConstraints(text: string | null): Constraints {
    // Use a prototype-free object for keys read from the URL.
    const dimensions = Object.create(null) as Record<string, Constraint>;
    for (const part of (text ?? '').split(';')) {
        const equals = part.indexOf('=');
        if (equals <= 0) {
            continue;
        }
        const id = decodedValue(part.slice(0, equals));
        const body = part.slice(equals + 1);
        const exclude = body.startsWith('!');
        const values = (exclude ? body.slice(1) : body)
            .split(',')
            .filter((value) => value !== '')
            .map((value) => (value === NOTHING_TOKEN ? NOTHING : decodedValue(value)));
        if (values.length > 0) {
            dimensions[id] = exclude ? { values, exclude } : { values };
        }
    }
    return dimensions;
}

export function formatConstraints(dimensions: Constraints): string {
    return Object.entries(dimensions)
        .filter((entry): entry is [string, Constraint] => (entry[1]?.values.length ?? 0) > 0)
        .map(([id, constraint]) => {
            const values = constraint.values
                .map((value) => (value === NOTHING ? NOTHING_TOKEN : encodeURIComponent(value)))
                .join(',');
            return `${encodeURIComponent(id)}=${constraint.exclude === true ? '!' : ''}${values}`;
        })
        .join(';');
}

export function withValueToggled(dimensions: Constraints, id: string, value: string): Constraints {
    const current = dimensions[id] ?? { values: [] };
    const values = current.values.includes(value)
        ? current.values.filter((candidate) => candidate !== value)
        : [...current.values, value];
    return values.length === 0 ? withDimensionCleared(dimensions, id) : { ...dimensions, [id]: { ...current, values } };
}

export function withDimensionCleared(dimensions: Constraints, id: string): Constraints {
    const { [id]: _dropped, ...rest } = dimensions;
    return rest;
}

export function withDimensionInverted(dimensions: Constraints, id: string): Constraints {
    const current = dimensions[id];
    if (current === undefined) {
        return dimensions;
    }
    return { ...dimensions, [id]: { ...current, exclude: current.exclude !== true } };
}

export function constrainedCount(dimensions: Constraints): number {
    return Object.values(dimensions).filter((constraint) => (constraint?.values.length ?? 0) > 0).length;
}

/** A value must be one that the dimension accepts, and one that a query can name. */
function acceptedValues(dimension: Dimension, values: readonly string[]): readonly string[] {
    const accepts = dimension.accepts ?? (() => true);
    return values.filter((value) => (value === NOTHING || canQuote(value)) && accepts(value));
}

/** Remove constraints on dimensions that are not offered, and values that their dimension cannot filter by. */
export function withoutStrandedChoices(
    dimensions: Constraints,
    offered: readonly Dimension[],
): Constraints | undefined {
    const byId = new Map(offered.map((dimension) => [dimension.id, dimension] as const));
    let changed = false;
    const kept: Record<string, Constraint> = {};
    for (const [id, constraint] of Object.entries(dimensions)) {
        if (constraint === undefined || constraint.values.length === 0) {
            continue;
        }
        const dimension = byId.get(id);
        const values = dimension === undefined ? [] : acceptedValues(dimension, constraint.values);
        if (values.length !== constraint.values.length) {
            changed = true;
        }
        if (values.length > 0) {
            kept[id] = { ...constraint, values };
        }
    }
    return changed ? kept : undefined;
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
