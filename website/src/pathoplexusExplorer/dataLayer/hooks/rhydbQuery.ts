/**
 * TanStack queries of RhyDB reads, on the query client that the `ConnectionProvider` holds: every hook in
 * `dataLayer/hooks` that reads from RhyDB uses `useRhydbQuery` / `useRhydbQueries`, or the row hooks below, instead
 * of `useQuery` / `useQueries` (ESLint enforces it).
 */

import {
    useQueries,
    useQuery,
    type QueriesResults,
    type QueryKey,
    type UseQueryOptions,
    type UseQueryResult,
} from '@tanstack/react-query';

import { useConnection, useRhydbQueryClient } from './connection.tsx';
import { textOf, type Connection } from '../transport/connection.ts';
import type { Queryable } from '../transport/relation.ts';
import type { RhydbRow } from '../transport/row.ts';

/** `useQuery` on the RhyDB query client. */
export function useRhydbQuery<
    TQueryFnData,
    TError = Error,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>): UseQueryResult<TData, TError> {
    return useQuery(options, useRhydbQueryClient());
}

/** `useQueries` on the RhyDB query client. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the same constraint as `useQueries`
export function useRhydbQueries<T extends any[], TCombinedResult = QueriesResults<T>>(
    options: Parameters<typeof useQueries<T, TCombinedResult>>[0],
): TCombinedResult {
    return useQueries<T, TCombinedResult>(options, useRhydbQueryClient());
}

/** Key the cache by instance and query text, so identical reads are shared. */
function rowsOptions(connection: Connection, query: Queryable | string | undefined, label: string) {
    const text = query === undefined ? undefined : textOf(query);
    return {
        queryKey: ['rhydb', ...connection.key, text ?? ''],
        queryFn: async ({ signal }: { signal: AbortSignal }) =>
            (await connection.query(query ?? '', label, { signal })).rows,
        enabled: text !== undefined,
    };
}

/** The rows of a query, under the column names that it asked for. Nothing is sent while the query is undefined. */
export function useRows(query: Queryable | string | undefined, label: string): UseQueryResult<RhydbRow[]> {
    const connection = useConnection();
    return useRhydbQuery(rowsOptions(connection, query, label));
}

type RowsResult = { data: (RhydbRow[] | undefined)[] | undefined; isLoading: boolean; error: Error | null };

/** Wait for every enabled query. Disabled queries can remain undefined. */
export function useManyRows(queries: readonly (Queryable | string | undefined)[], label: string): RowsResult {
    const connection = useConnection();
    const asked = queries.map((query) => query !== undefined);
    return useRhydbQueries({
        queries: queries.map((query) => rowsOptions(connection, query, label)),
        combine: (results) => ({
            data: results.every((result, index) => !asked[index] || result.data !== undefined)
                ? results.map((result, index) => (asked[index] ? result.data : undefined))
                : undefined,
            isLoading: results.some((result, index) => asked[index] && result.isLoading),
            error: results.find((result) => result.error !== null)?.error ?? null,
        }),
    });
}
