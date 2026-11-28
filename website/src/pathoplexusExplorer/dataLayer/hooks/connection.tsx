import { QueryCache, QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { createContext, useContext, useState, type FC, type ReactNode } from 'react';

import { getClientLogger } from '../../../clientLogger.ts';
import { UNEXPECTED_ERROR } from '../../domain/text.ts';
import { connect, type Connection } from '../transport/connection.ts';
import { RhydbError } from '../transport/query.ts';

const ConnectionContext = createContext<Connection | undefined>(undefined);

type ConnectionProviderProps = { url: string; children: ReactNode };

export const ConnectionProvider: FC<ConnectionProviderProps> = ({ url, children }) => {
    const [generation, setGeneration] = useState(0);
    return (
        <SnapshotProvider key={`${url}:${generation}`} url={url} refresh={() => setGeneration((value) => value + 1)}>
            {children}
        </SnapshotProvider>
    );
};

/** A report and its downloads share one cache for the lifetime of one database snapshot. */
const SnapshotProvider: FC<ConnectionProviderProps & { refresh: () => void }> = ({ url, children, refresh }) => {
    const [queryClient] = useState(() => createRhydbQueryClient(refresh));
    const [connection] = useState(() => {
        let snapshot: string | undefined;
        let retired = false;
        return connect({
            url,
            checkVersion(version) {
                if (version === null || !/^\d+$/.test(version)) {
                    logger.error('Missing or invalid RhyDB data version');
                    throw new Error(UNEXPECTED_ERROR);
                }
                snapshot ??= version;
                if (snapshot !== version && !retired) {
                    retired = true;
                    refresh();
                }
                if (retired) {
                    throw new DOMException('RhyDB snapshot changed', 'AbortError');
                }
            },
        });
    });
    useQuery(
        {
            queryKey: ['snapshot', url],
            queryFn: ({ signal }) => connection.dataVersion({ signal }),
            initialData: null,
            refetchOnMount: false,
            refetchOnWindowFocus: 'always',
            refetchInterval: 60_000,
            networkMode: 'always',
        },
        queryClient,
    );
    return (
        <QueryClientProvider client={queryClient}>
            <ConnectionContext.Provider value={connection}>{children}</ConnectionContext.Provider>
        </QueryClientProvider>
    );
};

/** The query client of the RhyDB reads, which logs every failure that a read ends in. */
function createRhydbQueryClient(refresh: () => void): QueryClient {
    return new QueryClient({
        queryCache: new QueryCache({
            onError(error, query) {
                logReadFailure(error);
                if (
                    query.queryKey[0] === 'snapshot' &&
                    !(error instanceof DOMException && error.name === 'AbortError')
                ) {
                    refresh();
                }
            },
        }),
        defaultOptions: {
            queries: {
                // The data changes a few times a day at most, so a read is reused for a while before it is sent again.
                staleTime: 10 * 60 * 1000,
                gcTime: 30 * 60 * 1000,
                // The transport already retries transient failures.
                retry: false,
                refetchOnWindowFocus: (query) => query.state.status === 'error',
            },
        },
    });
}

export function useConnection(): Connection {
    const connection = useContext(ConnectionContext);
    if (connection === undefined) {
        throw new Error('useConnection must be used inside a ConnectionProvider');
    }
    return connection;
}

const logger = getClientLogger('pathoplexusExplorer');

/** Log query failures with their panel label and HTTP status. */
export function logReadFailure(error: unknown): void {
    if (error instanceof DOMException && error.name === 'AbortError') {
        return;
    }
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
