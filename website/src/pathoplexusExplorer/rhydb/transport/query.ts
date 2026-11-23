/** Use a CORS simple request for browser queries to RhyDB. */

export const RHYDB_ERROR_KIND = {
    invalidQuery: 'invalid-query',
    notReady: 'not-ready',
    tooExpensive: 'too-expensive',
    http: 'http',
    network: 'network',
} as const;
export type RhydbErrorKind = (typeof RHYDB_ERROR_KIND)[keyof typeof RHYDB_ERROR_KIND];

export class RhydbError extends Error {
    readonly kind: RhydbErrorKind;
    readonly status: number | undefined;
    label: string | undefined;

    constructor(kind: RhydbErrorKind, message: string, status?: number) {
        super(message);
        this.name = 'RhydbError';
        this.kind = kind;
        this.status = status;
    }

    get userMessage(): string {
        const reason = this.reason;
        return this.label === undefined ? reason : `${this.label}: ${reason}`;
    }

    get unexpected(): boolean {
        return this.kind === RHYDB_ERROR_KIND.invalidQuery || this.kind === RHYDB_ERROR_KIND.http;
    }

    private get reason(): string {
        switch (this.kind) {
            case RHYDB_ERROR_KIND.invalidQuery:
                return `The query was rejected by RhyDB: ${this.message}`;
            case RHYDB_ERROR_KIND.notReady:
                return 'The RhyDB instance is starting up. Try again in a moment.';
            case RHYDB_ERROR_KIND.tooExpensive:
                return 'This query is too expensive for the RhyDB instance and timed out. Narrow the selection.';
            case RHYDB_ERROR_KIND.http:
                return `RhyDB request failed (HTTP ${this.status}): ${this.message}`;
            case RHYDB_ERROR_KIND.network:
                return 'Could not reach the RhyDB instance. Check the instance URL and your connection.';
        }
    }
}

const REQUEST_HEADERS: Readonly<Record<string, string>> = {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- HTTP header names
    'Content-Type': 'text/plain',
    // eslint-disable-next-line @typescript-eslint/naming-convention -- HTTP header names
    'Accept': 'application/x-ndjson',
};

function queryEndpoint(instanceUrl: string): string {
    return `${instanceUrl.replace(/\/+$/, '')}/query`;
}

/** Retries transient failures and reports HTTP and network failures as RhydbError. */
export async function query<Row = Record<string, unknown>>(
    instanceUrl: string,
    queryText: string,
    signal?: AbortSignal,
): Promise<Row[]> {
    return (await queryWithVersion<Row>(instanceUrl, queryText, signal)).rows;
}

/** Returns the rows and the data version of the same response. */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- Callers specify the NDJSON row shape.
export async function queryWithVersion<Row = Record<string, unknown>>(
    instanceUrl: string,
    queryText: string,
    signal?: AbortSignal,
): Promise<{ rows: Row[]; dataVersion: string | null }> {
    for (let attempt = 1; ; attempt++) {
        try {
            return await send<Row>(instanceUrl, queryText, signal);
        } catch (error) {
            if (attempt > RETRY_DELAYS_MS.length || !isTransient(error) || signal?.aborted === true) {
                throw error;
            }
            await wait(RETRY_DELAYS_MS[attempt - 1], signal);
        }
    }
}

/** Retry transient network errors, including HTTP/2 connection closure. */
const RETRY_DELAYS_MS = [150, 500];

/** Allow the server's query timeout to expire before aborting the request. */
const REQUEST_TIMEOUT_MS = 180_000;

function isTransient(error: unknown): boolean {
    return (
        error instanceof RhydbError &&
        (error.kind === RHYDB_ERROR_KIND.network || error.kind === RHYDB_ERROR_KIND.notReady)
    );
}

function wait(milliseconds: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            signal?.removeEventListener('abort', abort);
            resolve();
        }, milliseconds);
        function abort() {
            clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
        }
        signal?.addEventListener('abort', abort, { once: true });
    });
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- Preserve the row shape requested by the caller.
async function send<Row>(
    instanceUrl: string,
    queryText: string,
    signal?: AbortSignal,
): Promise<{ rows: Row[]; dataVersion: string | null }> {
    const deadline = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    let response: Response;
    try {
        response = await fetch(queryEndpoint(instanceUrl), {
            method: 'POST',
            headers: REQUEST_HEADERS,
            body: queryText,
            signal: signal === undefined ? deadline : AbortSignal.any([signal, deadline]),
        });
    } catch (error) {
        throw asNetworkError(error);
    }

    if (!response.ok) {
        throw await toError(response);
    }

    let text: string;
    try {
        text = await response.text();
    } catch (error) {
        throw asNetworkError(error);
    }
    const rows: Row[] = [];
    try {
        for (const line of text.split('\n')) {
            if (line.trim() !== '') {
                rows.push(JSON.parse(line) as Row);
            }
        }
    } catch {
        throw new RhydbError(RHYDB_ERROR_KIND.http, 'The response was not valid NDJSON.', response.status);
    }
    return { rows, dataVersion: response.headers.get('data-version') };
}

/** A request that the caller cancelled stays an AbortError. Any other failure to transfer the response is a network error. */
function asNetworkError(error: unknown): unknown {
    if (error instanceof DOMException && error.name === 'AbortError') {
        return error;
    }
    return new RhydbError(RHYDB_ERROR_KIND.network, error instanceof Error ? error.message : String(error));
}

async function toError(response: Response): Promise<RhydbError> {
    // The server can return JSON errors and the proxy can return HTML.
    let message = response.statusText;
    try {
        const body = await response.text();
        if (body.trimStart().startsWith('{')) {
            const parsed = JSON.parse(body) as { message?: string; error?: string };
            message = parsed.message ?? parsed.error ?? message;
        }
    } catch {
        // Keep the HTTP status text if the error body cannot be read.
    }
    switch (response.status) {
        case 400:
            return new RhydbError(RHYDB_ERROR_KIND.invalidQuery, message, 400);
        // Treat HTTP 502 and 503 as transient failures.
        case 502:
        case 503:
            return new RhydbError(RHYDB_ERROR_KIND.notReady, message, response.status);
        case 504:
            return new RhydbError(RHYDB_ERROR_KIND.tooExpensive, message, 504);
        default:
            return new RhydbError(RHYDB_ERROR_KIND.http, message, response.status);
    }
}
