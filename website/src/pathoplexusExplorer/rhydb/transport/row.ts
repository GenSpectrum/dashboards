export type RhydbValue = string | number | boolean | null;
export type RhydbRow = Record<string, RhydbValue | undefined>;

class RhydbRowError extends Error {
    readonly column: string;

    constructor(column: string, message: string) {
        super(`Column ${JSON.stringify(column)}: ${message}`);
        this.name = 'RhydbRowError';
        this.column = column;
    }
}

export function readText(row: RhydbRow, column: string): string {
    const value = row[column];
    if (typeof value === 'string') {
        return value;
    }
    throw new RhydbRowError(column, `expected text, got ${describe(value)}`);
}

/** Returns null for a recorded null and throws for missing or invalid values. */
export function readOptionalText(row: RhydbRow, column: string): string | null {
    const value = row[column];
    if (value === null || typeof value === 'string') {
        return value;
    }
    throw new RhydbRowError(column, `expected text or null, got ${describe(value)}`);
}

function describe(value: RhydbValue | undefined): string {
    return value === undefined ? 'no such column' : `${typeof value} ${JSON.stringify(value)}`;
}
