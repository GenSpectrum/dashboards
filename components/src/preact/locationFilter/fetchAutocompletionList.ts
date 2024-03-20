import { FetchAggregatedOperator } from '../../operator/FetchAggregatedOperator';

export async function fetchAutocompletionList(fields: string[], lapis: string, signal?: AbortSignal) {
    const toAncestorInHierarchyOverwriteValues = Array(fields.length - 1)
        .fill(0)
        .map((_, i) => i + 1)
        .map((i) => fields.slice(i).reduce((acc, field) => ({ ...acc, [field]: null }), {}));

    const fetchAggregatedOperator = new FetchAggregatedOperator<Record<string, string | null>>({}, fields);

    const data = (await fetchAggregatedOperator.evaluate(lapis, signal)).content;

    const locationValues = data
        .map((entry) => fields.reduce((acc, field) => ({ ...acc, [field]: entry[field] }), {}))
        .reduce<Set<string>>((setOfAllHierarchies, entry) => {
            setOfAllHierarchies.add(JSON.stringify(entry));
            toAncestorInHierarchyOverwriteValues.forEach((overwriteValues) => {
                setOfAllHierarchies.add(JSON.stringify({ ...entry, ...overwriteValues }));
            });
            return setOfAllHierarchies;
        }, new Set());

    return [...locationValues].map((json) => JSON.parse(json)).sort(compareLocationEntries(fields));
}

function compareLocationEntries(fields: string[]) {
    return (a: Record<string, string | null>, b: Record<string, string | null>) => {
        for (const field of fields) {
            const valueA = a[field];
            const valueB = b[field];
            if (valueA === valueB) {
                continue;
            }
            if (valueA === null) {
                return -1;
            }
            if (valueB === null) {
                return 1;
            }
            return valueA < valueB ? -1 : 1;
        }
        return 0;
    };
}
