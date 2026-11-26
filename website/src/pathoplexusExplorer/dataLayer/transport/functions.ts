/**
 * The RhyQL functions that this application calls.
 *
 * A named wrapper per function, so each one's argument names, their order and
 * how each argument is escaped are written down once.
 */

import { bool, Expr, field, fn, int, PRECEDENCE, set, str } from './expression.ts';

/** Rows in the group. */
export function count(): Expr {
    return fn('count');
}

/** Rows in the group in which the column is not null. */
export function countOf(column: string): Expr {
    return fn('count', [field(column)]);
}

export function sum(column: string): Expr {
    return fn('sum', [field(column)]);
}

export function min(column: string): Expr {
    return fn('min', [field(column)]);
}

export function max(column: string): Expr {
    return fn('max', [field(column)]);
}

/**
 * Whether a read carries `symbol` at a nucleotide position.
 *
 * The sequence travels as a string literal, not an identifier.
 */
export function nucleotideEquals(options: { position: number; symbol: string; sequenceName: string }): Expr {
    return symbolEquals('nucleotideEquals', options);
}

/** The same for a codon of a gene. */
export function aminoAcidEquals(options: { position: number; symbol: string; sequenceName: string }): Expr {
    return symbolEquals('aminoAcidEquals', options);
}

/** Whether a row has no value for this column or sequence. */
export function isNull(value: Expr): Expr {
    return fn('isNull', [value]);
}

/** Whether a read has any value for this sequence at all. */
export function isNotNull(sequence: Expr): Expr {
    return fn('isNotNull', [sequence]);
}

/**
 * Whether a read carries *any* non-reference, non-ambiguous symbol at a
 * nucleotide position — the "has a mutation here, don't care which" predicate.
 * `sequenceName` is mandatory (RhyDB rejects the call without it).
 */
export function hasMutation(options: { position: number; sequenceName: string }): Expr {
    return hasMutationAt('hasMutation', options);
}

/** The same for a codon of a gene. */
export function hasAAMutation(options: { position: number; sequenceName: string }): Expr {
    return hasMutationAt('hasAAMutation', options);
}

/**
 * Relax a sequence predicate to also admit reads that *could* match given their
 * ambiguous calls: `maybe(nucleotideEquals(…))`.
 */
export function maybe(child: Expr): Expr {
    return fn('maybe', [child]);
}

/**
 * Whether a read's insertion at a position contains `value` (a regex).
 * `aminoAcidInsertionContains` is the gene form.
 */
export function insertionContains(options: { position: number; value: string; sequenceName: string }): Expr {
    return insertionContainsAt('insertionContains', options);
}

export function aminoAcidInsertionContains(options: { position: number; value: string; sequenceName: string }): Expr {
    return insertionContainsAt('aminoAcidInsertionContains', options);
}

/**
 * `nOf(count, {a, b, c}[, matchExactly := bool])` — a read matches when at least
 * (or, with `matchExactly`, exactly) `count` of the matchers hold. Rendered by
 * hand: the call mixes a positional count, a set literal, and a named flag,
 * which `fn()`'s all-positional / all-named forms don't cover.
 */
export function nOf(count: number, matchers: readonly Expr[], options?: { matchExactly?: boolean }): Expr {
    if (!Number.isInteger(count) || count < 0) {
        throw new Error(`Not a valid n-of count: ${count}`);
    }
    const args = [String(count), set(matchers).render()];
    if (options?.matchExactly !== undefined) {
        args.push(`matchExactly := ${bool(options.matchExactly).render()}`);
    }
    return new Expr(PRECEDENCE.atomic, `nOf(${args.join(', ')})`);
}

function symbolEquals(name: string, options: { position: number; symbol: string; sequenceName: string }): Expr {
    if (!Number.isInteger(options.position) || options.position < 1) {
        throw new Error(`Not a reference position: ${options.position}`);
    }
    return fn(name, {
        position: int(options.position),
        symbol: str(options.symbol),
        sequenceName: str(options.sequenceName),
    });
}

function hasMutationAt(name: string, options: { position: number; sequenceName: string }): Expr {
    if (!Number.isInteger(options.position) || options.position < 1) {
        throw new Error(`Not a reference position: ${options.position}`);
    }
    return fn(name, { position: int(options.position), sequenceName: str(options.sequenceName) });
}

function insertionContainsAt(name: string, options: { position: number; value: string; sequenceName: string }): Expr {
    if (!Number.isInteger(options.position) || options.position < 1) {
        throw new Error(`Not a reference position: ${options.position}`);
    }
    return fn(name, {
        position: int(options.position),
        value: str(options.value),
        sequenceName: str(options.sequenceName),
    });
}
