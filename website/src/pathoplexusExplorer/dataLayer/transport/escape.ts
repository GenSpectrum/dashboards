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
