/** Whether a RhyQL string literal can hold the value. */
export function canQuote(value: string): boolean {
    return !/[\n\r\0]/.test(value);
}

/** Escape a single quote in a RhyQL string by doubling it. */
export function stringLiteral(value: string): string {
    if (!canQuote(value)) {
        throw new Error(`Unsupported character in string literal: ${JSON.stringify(value)}`);
    }
    return `'${value.replaceAll("'", "''")}'`;
}

/** Use quoted identifiers for column and table names that contain special characters. */
export function identifier(name: string): string {
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
        return name;
    }
    if (/[\n\r\0]/.test(name)) {
        throw new Error(`Unsupported character in identifier: ${JSON.stringify(name)}`);
    }
    return `"${name.replaceAll('"', '""')}"`;
}
