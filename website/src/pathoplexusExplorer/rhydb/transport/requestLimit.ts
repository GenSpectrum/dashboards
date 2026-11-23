const MAX_CONCURRENT_REQUESTS = 24;

let active = 0;
const waiting: (() => void)[] = [];

function acquire(): Promise<void> | undefined {
    if (active < MAX_CONCURRENT_REQUESTS) {
        active++;
        return undefined;
    }
    return new Promise<void>((resume) => waiting.push(resume));
}

function release(): void {
    const next = waiting.shift();
    if (next === undefined) {
        active--;
        return;
    }
    next();
}

/** Release the request slot on completion, failure, or cancellation. */
export async function withRequestLimit<T>(signal: AbortSignal | undefined, run: () => Promise<T>): Promise<T> {
    signal?.throwIfAborted();
    const queued = acquire();
    if (queued !== undefined) {
        await queued;
    }
    try {
        // The caller may have aborted while waiting for a request slot.
        signal?.throwIfAborted();
        return await run();
    } finally {
        release();
    }
}
