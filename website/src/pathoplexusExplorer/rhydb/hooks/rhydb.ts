import { QueryCache, QueryClient, useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';

import { getClientLogger } from '../../../clientLogger.ts';
import { connect, textOf, type Connection } from '../transport/connection.ts';
import { RhydbError } from '../transport/query.ts';
import type { Queryable } from '../transport/relation.ts';
import type { RhydbRow } from '../transport/row.ts';

let connection: Connection | undefined;

/** Use one connection per page. Reinitializing with the same URL preserves it. */
export function initRhydb(url: string): void {
    if (connection?.url !== url) {
        connection = connect(url);
    }
}

export function rhydb(): Connection {
    if (connection === undefined) {
        throw new Error('The RhyDB instance is set by the report page before it renders anything.');
    }
    return connection;
}

const logger = getClientLogger('pathoplexusExplorer');

/** Log query failures with their panel label and HTTP status. */
export function logReadFailure(error: unknown): void {
    if (!(error instanceof RhydbError)) {
        logger.error(`Pathoplexus Explorer: ${error instanceof Error ? error.message : String(error)}`);
        return;
    }
    const where = error.label ?? 'unlabelled read';
    const status = error.status === undefined ? '' : ` (HTTP ${error.status})`;
    const message = `Pathoplexus Explorer: ${where} failed as ${error.kind}${status}: ${error.message}`;
    if (error.unexpected) {
        logger.error(message);
    } else {
        logger.warn(message);
    }
}

export const rhydbQueryClient = new QueryClient({
    queryCache: new QueryCache({ onError: logReadFailure }),
    defaultOptions: {
        queries: {
            // The data changes a few times a day at most, so a read is reused for a while before it is sent again.
            staleTime: 10 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            // The transport already retries transient failures.
            retry: false,
            refetchOnWindowFocus: false,
        },
    },
});

export async function readRows(query: Queryable | string, label: string, signal?: AbortSignal) {
    return (await readRowsWithVersion(query, label, signal)).rows;
}

/** Returns the rows and the data version of the response that they came in. */
export async function readRowsWithVersion(query: Queryable | string, label: string, signal?: AbortSignal) {
    const { rows, dataVersion } = await rhydb().queryWithVersion(textOf(query), label, { signal });
    const decode = typeof query === 'object' ? query.decode : undefined;
    return { rows: decode === undefined ? rows : decode(rows), dataVersion };
}

function options(query: Queryable | string | undefined, label: string) {
    const text = query === undefined ? undefined : textOf(query);
    // Key the cache by instance and query text to share identical reads.
    return {
        queryKey: ['rhydb', rhydb().url, text ?? ''],
        queryFn: ({ signal }: { signal: AbortSignal }) => readRows(query ?? '', label, signal),
        enabled: text !== undefined,
    };
}

export function useRows(query: Queryable | string | undefined, label: string): UseQueryResult<RhydbRow[]> {
    return useQuery(options(query, label), rhydbQueryClient);
}

type RowsResult = { data: (RhydbRow[] | undefined)[] | undefined; isLoading: boolean; error: Error | null };

/** Wait for every enabled query. Disabled queries can remain undefined. */
export function useManyRows(queries: readonly (Queryable | string | undefined)[], label: string): RowsResult {
    const asked = queries.map((query) => query !== undefined);
    return useQueries(
        {
            queries: queries.map((query) => options(query, label)),
            combine: (results) => ({
                data: results.every((result, index) => !asked[index] || result.data !== undefined)
                    ? results.map((result, index) => (asked[index] ? result.data : undefined))
                    : undefined,
                isLoading: results.some((result, index) => asked[index] && result.isLoading),
                error: results.find((result) => result.error !== null)?.error ?? null,
            }),
        },
        rhydbQueryClient,
    );
}
