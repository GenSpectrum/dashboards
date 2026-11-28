import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';

import { useConnection } from './connection.tsx';
import { combineQueryResults } from './queryResult.ts';
import { textOf, type Connection } from '../transport/connection.ts';
import type { Queryable } from '../transport/relation.ts';
import type { RhydbRow } from '../transport/row.ts';

/** Key the cache by instance and query text, so identical reads are shared. */
function rowsOptions<T = RhydbRow[]>(
    connection: Connection,
    query: Queryable | string | undefined,
    label: string,
    select?: (rows: RhydbRow[]) => T,
) {
    const text = query === undefined ? undefined : textOf(query);
    const decode = typeof query === 'object' ? query.decode : undefined;
    return {
        queryKey: ['rhydb', ...connection.key, text ?? ''],
        queryFn: async ({ signal }: { signal: AbortSignal }) =>
            (await connection.query(text ?? '', label, { signal })).rows,
        select:
            decode === undefined
                ? select
                : (rows: RhydbRow[]) => {
                      const named = decode(rows);
                      return select === undefined ? (named as T) : select(named);
                  },
        enabled: text !== undefined,
    };
}

/** The rows of a query, under the column names that it asked for. Nothing is sent while the query is undefined. */
export function useRows<T = RhydbRow[]>(
    query: Queryable | string | undefined,
    label: string,
    select?: (rows: RhydbRow[]) => T,
): UseQueryResult<T> {
    const connection = useConnection();
    return useQuery(rowsOptions(connection, query, label, select));
}

type RowsResult = { data: (RhydbRow[] | undefined)[] | undefined; isLoading: boolean; error: Error | null };

/** Wait for every enabled query. Disabled queries can remain undefined. */
export function useManyRows(queries: readonly (Queryable | string | undefined)[], label: string): RowsResult {
    const connection = useConnection();
    const asked = queries.map((query) => query !== undefined);
    return useQueries({
        queries: queries.map((query) => rowsOptions(connection, query, label)),
        combine: (results) =>
            combineQueryResults(
                results.every((result, index) => !asked[index] || result.data !== undefined)
                    ? results.map((result, index) => (asked[index] ? result.data : undefined))
                    : undefined,
                results,
            ),
    });
}
