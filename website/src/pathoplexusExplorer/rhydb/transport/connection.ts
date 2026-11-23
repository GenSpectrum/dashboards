import { RhydbError, queryWithVersion } from './query.ts';
import { table, type Queryable } from './relation.ts';
import { withRequestLimit } from './requestLimit.ts';
import type { RhydbRow } from './row.ts';

export type Connection = {
    url: string;
    /** The download timestamp of the current data, in Unix seconds. */
    dataVersion(options?: { signal?: AbortSignal }): Promise<string | null>;
    query<Row extends RhydbRow = RhydbRow>(
        query: Queryable | string,
        label: string,
        options?: { signal?: AbortSignal },
    ): Promise<Row[]>;
    /** The rows and the data version of the same response. */
    queryWithVersion(
        query: Queryable | string,
        label: string,
        options?: { signal?: AbortSignal },
    ): Promise<{ rows: RhydbRow[]; dataVersion: string | null }>;
};

export function connect(url: string): Connection {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- Preserve the row shape requested by the caller.
    const versioned = <Row extends RhydbRow>(
        query: Queryable | string,
        label: string,
        options?: { signal?: AbortSignal },
    ) =>
        withRequestLimit(options?.signal, () =>
            queryWithVersion<Row>(url, textOf(query), options?.signal).catch((error: unknown) =>
                labelled(error, label),
            ),
        );
    return {
        url,
        dataVersion: (options) =>
            withRequestLimit(options?.signal, async () => {
                const result = await queryWithVersion(
                    url,
                    table('reference_genomes').project(['name']).limit(1).render(),
                    options?.signal,
                );
                return result.dataVersion;
            }),
        query: async <Row extends RhydbRow = RhydbRow>(
            query: Queryable | string,
            label: string,
            options?: { signal?: AbortSignal },
        ) => (await versioned<Row>(query, label, options)).rows,
        queryWithVersion: versioned,
    };
}

function labelled(error: unknown, label: string): never {
    if (error instanceof RhydbError) {
        error.label = label;
    }
    throw error;
}

export function textOf(query: Queryable | string): string {
    return typeof query === 'string' ? query : query.render();
}
