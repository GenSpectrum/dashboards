/**
 * One RhyDB instance to send queries to.
 *
 * Every request that the application makes is sent by `query` here, which is
 * what makes the CORS rules, the retry and the concurrency limit apply to all
 * of them. `key` is the instance's identity, for code that caches per instance.
 *
 * The Explorer's instance holds one table per pathogen, so a connection is not
 * bound to a table: each query names the tables that it combines.
 */

import { query as send, type QueryResult } from './query.ts';
import { table, type Queryable } from './relation.ts';
import { withRequestLimit } from './requestLimit.ts';
import type { RhydbRow } from './row.ts';

export type Connection = {
    /**
     * The instance's identity as a cache-key prefix. Spread it, so the key
     * stays a structurally hashable array: `['rows', ...connection.key, 1]`.
     */
    readonly key: readonly [url: string];
    /**
     * Sends a query and returns its typed rows, under the column names that the
     * query asked for.
     *
     * Takes a relation or the text of one, so hand-written query text is sent
     * under the same rules and retry as everything else.
     */
    query<Row extends RhydbRow = RhydbRow>(
        query: Queryable | string,
        /** What asked for it, as the user sees that part of the page named. */
        label: string,
        options?: { signal?: AbortSignal },
    ): Promise<QueryResult<Row>>;
    /** The download timestamp of the current data, in Unix seconds. */
    dataVersion(options?: { signal?: AbortSignal }): Promise<string | null>;
};

export function connect(options: { url: string; checkVersion?: (version: string | null) => void }): Connection {
    const { url } = options;
    const connection: Connection = {
        key: [url],
        query: async <Row extends RhydbRow = RhydbRow>(
            query: Queryable | string,
            label: string,
            queryOptions?: { signal?: AbortSignal },
        ) => {
            const result = await withRequestLimit(queryOptions?.signal, () =>
                send<Row>(url, textOf(query), label, queryOptions?.signal),
            );
            queryOptions?.signal?.throwIfAborted();
            options.checkVersion?.(result.dataVersion);
            const decode = typeof query === 'string' ? undefined : query.decode;
            return decode === undefined ? result : { ...result, rows: decode(result.rows) as Row[] };
        },
        dataVersion: async (dataVersionOptions) => {
            const { dataVersion } = await connection.query(
                table('reference_genomes').project(['name']).limit(1),
                'Last updated',
                dataVersionOptions,
            );
            return dataVersion;
        },
    };
    return connection;
}

export function textOf(query: Queryable | string): string {
    return typeof query === 'string' ? query : query.render();
}
