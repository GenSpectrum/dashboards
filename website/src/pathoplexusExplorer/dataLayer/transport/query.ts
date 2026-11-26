/**
 * The single owner of every HTTP request to RhyDB.
 *
 * Requests stay within the CORS "simple request" rules: `Content-Type:
 * text/plain` and, at most, `Accept`. The instance answers `OPTIONS /query`
 * with 405, so a preflighted request fails.
 */

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
    /** What asked for the rows, as the user sees that part of the page named. */
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

    /** A failure that no retry and no narrower selection fixes, which points to a bug or a changed instance. */
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

/**
 * The only headers that a RhyDB request may carry.
 *
 * Exported so the curl line offered to the user carries the same headers.
 */
export const REQUEST_HEADERS: Readonly<Record<string, string>> = {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- HTTP header names
    'Content-Type': 'text/plain',
    // eslint-disable-next-line @typescript-eslint/naming-convention -- HTTP header names
    'Accept': 'application/x-ndjson',
};

/** Where a query is sent. */
export function queryEndpoint(instanceUrl: string): string {
    return `${instanceUrl.replace(/\/+$/, '')}/query`;
}

/** The curl command that reproduces a query, with the headers above. */
export function curlFor(instanceUrl: string, queryText: string): string {
    const quote = (value: string) => `'${value.replace(/'/g, "'\\''")}'`;
    return [
        'curl',
        '-X POST',
        quote(queryEndpoint(instanceUrl)),
        ...Object.entries(REQUEST_HEADERS).map(([name, value]) => `-H ${quote(`${name}: ${value}`)}`),
        `--data-binary ${quote(queryText)}`,
    ].join(' \\\n  ');
}

export type QueryResult<Row> = {
    rows: Row[];
    /** Unix timestamp identifying the database snapshot that answered. */
    dataVersion: string | null;
};

/**
 * Sends a query, retrying transient failures.
 *
 * A failure is reported as a `RhydbError` that carries `label`, so the message
 * shown to the user names the part of the page that asked.
 */
export async function query<Row = Record<string, unknown>>(
    instanceUrl: string,
    queryText: string,
    /** What needs the answer, as the user sees that part of the page named. */
    label: string,
    signal?: AbortSignal,
): Promise<QueryResult<Row>> {
    for (let attempt = 1; ; attempt++) {
        try {
            return await send<Row>(instanceUrl, queryText, signal);
        } catch (error) {
            if (attempt > RETRY_DELAYS_MS.length || !isTransient(error) || signal?.aborted === true) {
                throw labelled(error, label);
            }
            await wait(RETRY_DELAYS_MS[attempt - 1], signal);
        }
    }
}

function labelled(error: unknown, label: string): unknown {
    if (error instanceof RhydbError) {
        error.label = label;
    }
    return error;
}

/**
 * How long to wait before each retry, and so how many there are.
 *
 * The instance closes its HTTP/2 connection periodically, sending GOAWAY. A
 * browser cannot replay a POST that was already sent when that arrives, so it
 * surfaces as a failed fetch — unpredictably, on any one request of a large
 * sweep.
 */
const RETRY_DELAYS_MS = [150, 500];

/** Allow the server's query timeout to expire before aborting the request. */
const REQUEST_TIMEOUT_MS = 180_000;

/**
 * Whether a failure might not happen again. A rejected query and one too
 * expensive to answer will fail identically however often they are sent, and
 * retrying a timeout only doubles the load that caused it.
 */
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

async function send<Row>(instanceUrl: string, queryText: string, signal?: AbortSignal): Promise<QueryResult<Row>> {
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
    // Errors from RhyDB itself are JSON; the fronting proxy answers timeouts
    // with an HTML 504 page.
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
        // 502 and 503 both mean the instance is not answering queries right
        // now: 503 while it loads its data, 502 while the proxy has no backend
        // to reach at all. They call for the same thing from the user, and the
        // same retry treatment, so they are one kind.
        case 502:
        case 503:
            return new RhydbError(RHYDB_ERROR_KIND.notReady, message, response.status);
        case 504:
            return new RhydbError(RHYDB_ERROR_KIND.tooExpensive, message, 504);
        default:
            return new RhydbError(RHYDB_ERROR_KIND.http, message, response.status);
    }
}
