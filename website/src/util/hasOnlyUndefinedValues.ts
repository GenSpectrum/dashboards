export function hasOnlyUndefinedValues(obj: object): boolean {
    return Object.values(obj).every((value) => {
        if (typeof value === 'object' && value !== null) {
            return hasOnlyUndefinedValues(value);
        }
        return value === undefined;
    });
}
