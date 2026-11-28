/**
 * RhyQL expressions, as a tree that renders itself — one class closed over
 * its children.
 *
 * The tree guarantees two things. Every literal is escaped where it is built,
 * so a value cannot reach the query text without passing through `escape.ts`.
 * And every node knows how tightly it binds, so parentheses are added exactly
 * where they are needed and nowhere else.
 */

import { identifier, stringLiteral } from './escape.ts';

/**
 * How tightly an operator binds. A child is parenthesized only where its
 * parent binds tighter than it does.
 */
export const PRECEDENCE = {
    or: 10,
    and: 20,
    not: 30,
    comparison: 40,
    postfix: 50,
    atomic: 60,
} as const;

export type Precedence = (typeof PRECEDENCE)[keyof typeof PRECEDENCE];

/** Named arguments render `name := value`; positional ones render bare. */
export type Args = readonly Expr[] | Readonly<Record<string, Expr>>;

export class Expr {
    /** Rendered on construction, so an unescapable value throws where it is written. */
    readonly precedence: Precedence;
    private readonly text: string;

    constructor(precedence: Precedence, text: string) {
        this.precedence = precedence;
        this.text = text;
    }

    /** The expression on its own, as it would be sent. */
    render(): string {
        return this.text;
    }

    /**
     * The expression inside a parent that binds at `parent`, parenthesized
     * only where it has to be. An argument list needs no parentheses at all,
     * since a comma already delimits it — pass nothing for that.
     */
    renderIn(parent?: Precedence): string {
        return parent !== undefined && this.precedence < parent ? `(${this.text})` : this.text;
    }

    /** The symbol that this sequence column carries at a reference position. */
    at(position: number): Expr {
        return this.postfix(`at(${positionArgument(position)})`);
    }

    eq(other: Expr): Expr {
        return this.compare('=', other);
    }

    lte(other: Expr): Expr {
        return this.compare('<=', other);
    }

    gte(other: Expr): Expr {
        return this.compare('>=', other);
    }

    /**
     * `column.in({'a', 'b'})`. Throws on an empty set.
     */
    isIn(values: readonly Expr[]): Expr {
        return this.postfix(`in(${set(values).render()})`);
    }

    /** An ordering key: `n.desc()`. */
    desc(): Expr {
        return this.postfix('desc()');
    }

    /** Whether this lineage column holds the value, or with `sublineages` one of its descendants, by the table's lineage relations. */
    lineageFromTables(options: { value: Expr; definitions: Expr; aliases: Expr; sublineages: boolean }): Expr {
        const args = renderArgs([options.value, options.definitions, options.aliases]);
        return this.postfix(`lineageFromTables(${args}${options.sublineages ? ', includeSublineages := true' : ''})`);
    }

    private postfix(suffix: string): Expr {
        return new Expr(PRECEDENCE.postfix, `${this.renderIn(PRECEDENCE.postfix)}.${suffix}`);
    }

    private compare(operator: string, other: Expr): Expr {
        return new Expr(
            PRECEDENCE.comparison,
            `${this.renderIn(PRECEDENCE.comparison)} ${operator} ${other.renderIn(PRECEDENCE.comparison)}`,
        );
    }
}

/** A column or a sequence, escaped as an identifier. */
export function field(name: string): Expr {
    return new Expr(PRECEDENCE.atomic, identifier(name));
}

/** A quoted string literal, with any internal quote doubled. */
export function str(value: string): Expr {
    return new Expr(PRECEDENCE.atomic, stringLiteral(value));
}

/**
 * A `DATE32` literal: `'2026-06-01'::date`.
 *
 * RhyDB rejects a bare string in a comparison against a `DATE32` column; the
 * `::date` cast is how a date reaches such a comparison (see `dateFilter` in
 * `dataLayer/queries/scope.ts`).
 */
export function dateLiteral(value: string): Expr {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error(`Not an ISO date (yyyy-mm-dd): ${JSON.stringify(value)}`);
    }
    return new Expr(PRECEDENCE.atomic, `${stringLiteral(value)}::date`);
}

/** An integer literal. Zero and negatives included; the guards are on the callers that need them. */
export function int(value: number): Expr {
    if (!Number.isInteger(value)) {
        throw new Error(`Not an integer: ${value}`);
    }
    return new Expr(PRECEDENCE.atomic, String(value));
}

/** A finite number literal. */
export function num(value: number): Expr {
    if (!Number.isFinite(value)) {
        throw new Error(`Not a finite number: ${value}`);
    }
    return new Expr(PRECEDENCE.atomic, String(value));
}

export function bool(value: boolean): Expr {
    return new Expr(PRECEDENCE.atomic, String(value));
}

/** `{a, b}`. Empty throws, for the reason on `isIn`. */
export function set(values: readonly Expr[]): Expr {
    if (values.length === 0) {
        throw new Error('A set literal needs at least one value');
    }
    return new Expr(PRECEDENCE.atomic, `{${values.map((value) => value.renderIn()).join(', ')}}`);
}

/**
 * `{n := count(), p1 := main.at(1722)}`.
 *
 * Keys keep their insertion order, and a column cannot appear twice.
 */
export function record(entries: Readonly<Record<string, Expr>>): Expr {
    const assignments = Object.entries(entries);
    if (assignments.length === 0) {
        throw new Error('A record needs at least one assignment');
    }
    return new Expr(
        PRECEDENCE.atomic,
        `{${assignments.map(([name, value]) => `${identifier(name)} := ${value.renderIn()}`).join(', ')}}`,
    );
}

/** A named function: `count()`, `nucleotideEquals(position := 1, …)`. */
export function fn(name: string, args?: Args): Expr {
    return new Expr(PRECEDENCE.atomic, `${name}(${renderArgs(args)})`);
}

/**
 * `a && b`, over the parts that are present.
 *
 * Undefined where nothing is left, which is what lets "no filter at all" be a
 * value rather than an empty string, and one part where only one is present,
 * so a single predicate is never wrapped. With a first part given, the result
 * is always an expression.
 */
export function and(first: Expr, ...rest: readonly (Expr | undefined)[]): Expr;
export function and(...parts: readonly (Expr | undefined)[]): Expr | undefined;
export function and(...parts: readonly (Expr | undefined)[]): Expr | undefined {
    return join(parts, '&&', PRECEDENCE.and);
}

/** `a || b`, over the parts that are present. */
export function or(first: Expr, ...rest: readonly (Expr | undefined)[]): Expr;
export function or(...parts: readonly (Expr | undefined)[]): Expr | undefined;
export function or(...parts: readonly (Expr | undefined)[]): Expr | undefined {
    return join(parts, '||', PRECEDENCE.or);
}

/** `!a`. A call binds tighter, so `!nucleotideEquals(…)` needs no parentheses. */
export function not(inner: Expr): Expr {
    return new Expr(PRECEDENCE.not, `!${inner.renderIn(PRECEDENCE.not)}`);
}

function join(parts: readonly (Expr | undefined)[], operator: string, precedence: Precedence): Expr | undefined {
    const present = parts.filter((part): part is Expr => part !== undefined);
    if (present.length === 0) {
        return undefined;
    }
    if (present.length === 1) {
        return present[0];
    }
    return new Expr(precedence, present.map((part) => part.renderIn(precedence)).join(` ${operator} `));
}

/**
 * `a, b` or `name := a, name := b`.
 *
 * Shared with the relation pipeline, whose operations take the same argument
 * forms. Commas delimit, so nothing here is parenthesized.
 */
export function renderArgs(args?: Args): string {
    if (args === undefined) {
        return '';
    }
    if (Array.isArray(args)) {
        return args.map((value: Expr) => value.renderIn()).join(', ');
    }
    return Object.entries(args as Record<string, Expr>)
        .map(([name, value]) => `${name} := ${value.renderIn()}`)
        .join(', ');
}

/** A reference position: 1-based. */
function positionArgument(position: number): string {
    if (!Number.isInteger(position) || position < 1) {
        throw new Error(`Not a reference position: ${position}`);
    }
    return String(position);
}
