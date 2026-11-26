export function defined<T>(value: T | undefined, what: string): T {
    if (value === undefined) {
        throw new Error(`Expected ${what}, and there was none.`);
    }
    return value;
}
