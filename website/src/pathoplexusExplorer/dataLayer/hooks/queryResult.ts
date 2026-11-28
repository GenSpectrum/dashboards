export type Loadable<T> = { data: T | undefined; isLoading: boolean; error: Error | null };

export function firstErrorOf(parts: readonly { error: Error | null }[]): Error | null {
    return parts.find((part) => part.error !== null)?.error ?? null;
}

/** Combine loading states and propagate the first error. */
export function combineQueryResults<T>(
    data: T | undefined,
    parts: readonly { isLoading: boolean; error: Error | null }[],
): Loadable<T> {
    const error = firstErrorOf(parts);
    return {
        data: error === null ? data : undefined,
        isLoading: parts.some((part) => part.isLoading),
        error,
    };
}

/** A reader can reject rows whose columns no longer match the query. */
export function readQueryData<T>(read: () => T | undefined): Loadable<T> {
    try {
        return { data: read(), error: null, isLoading: false };
    } catch (error) {
        if (error instanceof Error) {
            return { data: undefined, isLoading: false, error };
        }
        throw error;
    }
}
