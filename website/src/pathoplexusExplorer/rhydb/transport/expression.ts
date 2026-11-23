/** Build RhyQL expressions with escaped literals and precedence-aware rendering. */

import { identifier, stringLiteral } from './escape.ts';

export const PRECEDENCE = {
    or: 10,
    and: 20,
    not: 30,
    comparison: 40,
    postfix: 50,
    atomic: 60,
} as const;

export type Precedence = (typeof PRECEDENCE)[keyof typeof PRECEDENCE];

export type Args = readonly Expr[] | Readonly<Record<string, Expr>>;

export class Expr {
    constructor(
        readonly precedence: Precedence,
        private readonly text: string,
    ) {}

    render(): string {
        return this.text;
    }

    renderIn(parent?: Precedence): string {
        return parent !== undefined && this.precedence < parent ? `(${this.text})` : this.text;
    }

    at(position: number): Expr {
        return this.postfix(`at(${positionArgument(position)})`);
    }

    eq(other: Expr): Expr {
        return this.compare('=', other);
    }

    neq(other: Expr): Expr {
        return this.compare('<>', other);
    }

    lt(other: Expr): Expr {
        return this.compare('<', other);
    }

    lte(other: Expr): Expr {
        return this.compare('<=', other);
    }

    gt(other: Expr): Expr {
        return this.compare('>', other);
    }

    gte(other: Expr): Expr {
        return this.compare('>=', other);
    }

    /** RhyQL requires a nonempty set for `in`. */
    isIn(values: readonly Expr[]): Expr {
        return this.postfix(`in(${set(values).render()})`);
    }

    /** Use the table-specific lineage relations to include descendants. */
    lineageFromTables(options: { value: Expr; definitions: Expr; aliases: Expr; sublineages: boolean }): Expr {
        const args = [options.value, options.definitions, options.aliases];
        const named: Record<string, Expr> = options.sublineages ? { includeSublineages: booleanLiteral(true) } : {};
        return this.postfix(callWith('lineageFromTables', args, named).render());
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

export function field(name: string): Expr {
    return new Expr(PRECEDENCE.atomic, identifier(name));
}

export function textLiteral(value: string): Expr {
    return new Expr(PRECEDENCE.atomic, stringLiteral(value));
}

/** Date comparisons require a typed RhyQL literal, such as `'2026-06-01'::date`. */
export function dateLiteral(value: string): Expr {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error(`Not an ISO date (yyyy-mm-dd): ${JSON.stringify(value)}`);
    }
    return new Expr(PRECEDENCE.atomic, `${stringLiteral(value)}::date`);
}

export function integerLiteral(value: number): Expr {
    if (!Number.isInteger(value)) {
        throw new Error(`Not an integer: ${value}`);
    }
    return new Expr(PRECEDENCE.atomic, String(value));
}

export function numberLiteral(value: number): Expr {
    if (!Number.isFinite(value)) {
        throw new Error(`Not a finite number: ${value}`);
    }
    return new Expr(PRECEDENCE.atomic, String(value));
}

export function booleanLiteral(value: boolean): Expr {
    return new Expr(PRECEDENCE.atomic, String(value));
}

/** RhyQL does not support empty set literals. */
export function set(values: readonly Expr[]): Expr {
    if (values.length === 0) {
        throw new Error('A set literal needs at least one value');
    }
    return new Expr(PRECEDENCE.atomic, `{${values.map((value) => value.renderIn()).join(', ')}}`);
}

/** Retain field order when rendering a record. */
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

export function call(name: string, args?: Args): Expr {
    return new Expr(PRECEDENCE.atomic, `${name}(${renderArgs(args)})`);
}

export function callWith(name: string, positional: readonly Expr[], named: Readonly<Record<string, Expr>>): Expr {
    const parts = [renderArgs(positional), renderArgs(named)].filter((part) => part !== '');
    return new Expr(PRECEDENCE.atomic, `${name}(${parts.join(', ')})`);
}

/** Return undefined if no predicate is supplied. */
export function and(first: Expr, ...rest: readonly (Expr | undefined)[]): Expr;
export function and(...parts: readonly (Expr | undefined)[]): Expr | undefined;
export function and(...parts: readonly (Expr | undefined)[]): Expr | undefined {
    return join(parts, '&&', PRECEDENCE.and);
}

export function or(first: Expr, ...rest: readonly (Expr | undefined)[]): Expr;
export function or(...parts: readonly (Expr | undefined)[]): Expr | undefined;
export function or(...parts: readonly (Expr | undefined)[]): Expr | undefined {
    return join(parts, '||', PRECEDENCE.or);
}

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

/** Render positional and named arguments for calls and relation operations. */
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

/** RhyDB positions are 1-based. */
function positionArgument(position: number): string {
    if (!Number.isInteger(position) || position < 1) {
        throw new Error(`Not a reference position: ${position}`);
    }
    return String(position);
}
