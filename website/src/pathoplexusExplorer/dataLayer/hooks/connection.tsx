/**
 * The RhyDB instance of a page, in React context.
 *
 * A `ConnectionProvider` creates one `Connection` (`dataLayer/transport/connection.ts`) for its `url`, and every
 * component below it shares that connection and the query client of the RhyDB reads. Every RhyDB read in
 * `dataLayer/hooks/**` goes through them, so the CORS rules, the retry and the failure logging apply to all of them.
 */

import { QueryCache, QueryClient } from '@tanstack/react-query';
import { createContext, useContext, useMemo, useState, type FC, type ReactNode } from 'react';

import { getClientLogger } from '../../../clientLogger.ts';
import { connect, type Connection } from '../transport/connection.ts';
import { RhydbError } from '../transport/query.ts';

type RhydbInstance = { connection: Connection; queryClient: QueryClient };

const RhydbInstanceContext = createContext<RhydbInstance | undefined>(undefined);

type ConnectionProviderProps = {
    url: string;
    /**
     * The query client of the RhyDB reads (`createRhydbQueryClient`). Without one, the provider has its own, with a
     * cache that goes when it unmounts, as for a test.
     */
    queryClient?: QueryClient;
    children: ReactNode;
};

export const ConnectionProvider: FC<ConnectionProviderProps> = ({ url, queryClient: givenQueryClient, children }) => {
    const [ownQueryClient] = useState(() => givenQueryClient ?? createRhydbQueryClient());
    const queryClient = givenQueryClient ?? ownQueryClient;
    const value = useMemo<RhydbInstance>(() => ({ connection: connect({ url }), queryClient }), [url, queryClient]);
    return <RhydbInstanceContext.Provider value={value}>{children}</RhydbInstanceContext.Provider>;
};

/** The query client of the RhyDB reads, which logs every failure that a read ends in. */
export function createRhydbQueryClient(): QueryClient {
    return new QueryClient({
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
}

function useRhydbInstance(): RhydbInstance {
    const instance = useContext(RhydbInstanceContext);
    if (instance === undefined) {
        throw new Error('useConnection / useRhydbQueryClient must be used inside a ConnectionProvider');
    }
    return instance;
}

/**
 * The RhyDB instance to send queries to.
 *
 * Stable while the instance is, so it can be a dependency of a memo, an effect or a TanStack query key (spread
 * `connection.key`).
 */
export function useConnection(): Connection {
    return useRhydbInstance().connection;
}

/** The query client of the RhyDB reads; see `rhydbQuery.ts`. */
export function useRhydbQueryClient(): QueryClient {
    return useRhydbInstance().queryClient;
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
