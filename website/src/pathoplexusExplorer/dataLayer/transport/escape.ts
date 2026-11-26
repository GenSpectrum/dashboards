/**
 * RhyQL string literals are single-quoted; a quote inside one is escaped by
 * doubling it.
 */
export function stringLiteral(value: string): string {
    if (!canQuote(value)) {
        throw new Error(`Unsupported character in string literal: ${JSON.stringify(value)}`);
    }
    return `'${value.replaceAll("'", "''")}'`;
}

/** Whether a string literal can hold the value: line breaks and NUL characters cannot be sent. */
export function canQuote(value: string): boolean {
    return !/[\n\r\0]/.test(value);
}

/**
 * Column and table names are emitted as identifiers. Plain identifiers pass
 * through; anything else is double-quoted with internal quotes doubled.
 */
export function identifier(name: string): string {
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
        return name;
    }
    if (/[\n\r\0]/.test(name)) {
        throw new Error(`Unsupported character in identifier: ${JSON.stringify(name)}`);
    }
    return `"${name.replaceAll('"', '""')}"`;
}

/**
 * A set literal, which is what `in` takes: `sampleId.in({'a', 'b'})`.
 *
 * Throws on an empty set.
 */
export function stringLiteralSet(values: string[]): string {
    if (values.length === 0) {
        throw new Error('A set literal needs at least one value');
    }
    return `{${values.map(stringLiteral).join(', ')}}`;
}

/** Positions and counts are 1-based everywhere that they are used. */
export function positiveInt(value: number): string {
    if (!Number.isInteger(value) || value < 1) {
        throw new Error(`Not a positive integer: ${value}`);
    }
    return String(value);
}

export function proportion(value: number): string {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
        throw new Error(`Not a proportion in [0, 1]: ${value}`);
    }
    return String(value);
}
