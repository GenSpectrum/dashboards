/** RhyQL aggregate and predicate functions used by the Explorer. */

import { field, call, type Expr } from './expression.ts';

export function count(): Expr {
    return call('count');
}

/** Counts non-null values in the column. */
export function countOf(column: string): Expr {
    return call('count', [field(column)]);
}

export function sum(column: string): Expr {
    return call('sum', [field(column)]);
}

export function min(column: string): Expr {
    return call('min', [field(column)]);
}

export function max(column: string): Expr {
    return call('max', [field(column)]);
}

export function isNull(column: string): Expr {
    return call('isNull', [field(column)]);
}

export function isNotNull(column: string): Expr {
    return call('isNotNull', [field(column)]);
}
