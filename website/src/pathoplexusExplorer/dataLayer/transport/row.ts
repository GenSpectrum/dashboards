/**
 * Typed reading of the rows that an instance sent.
 *
 * NDJSON arrives untyped. A reader handed a value of the wrong type throws and
 * names the column.
 *
 * These readers say only what type came back. What a value *means* belongs to
 * the domain.
 */

export type RhydbValue = string | number | boolean | null;
export type RhydbRow = Record<string, RhydbValue | undefined>;

export class RhydbRowError extends Error {
    readonly column: string;

    constructor(column: string, message: string) {
        super(`Column ${JSON.stringify(column)}: ${message}`);
        this.name = 'RhydbRowError';
        this.column = column;
    }
}

/** Text, which must be present and not null. */
export function readText(row: RhydbRow, column: string): string {
    const value = row[column];
    if (typeof value === 'string') {
        return value;
    }
    throw new RhydbRowError(column, `expected text, got ${describe(value)}`);
}

/**
 * Text or null, where null is data.
 *
 * A column that is missing altogether throws.
 */
export function readOptionalText(row: RhydbRow, column: string): string | null {
    const value = row[column];
    if (value === null || typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number') {
        // A symbol column of digits would arrive as a number; keep it readable
        // rather than refusing it.
        return String(value);
    }
    throw new RhydbRowError(column, `expected text or null, got ${describe(value)}`);
}

function describe(value: RhydbValue | undefined): string {
    return value === undefined ? 'no such column' : `${typeof value} ${JSON.stringify(value)}`;
}
