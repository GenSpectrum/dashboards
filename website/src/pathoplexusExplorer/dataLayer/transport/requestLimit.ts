/**
 * A cap on how many RhyDB requests are open at once, across the whole
 * application.
 *
 * `withRequestLimit` wraps a request: it waits until fewer than
 * `MAX_CONCURRENT_REQUESTS` are running, runs it, then hands its place to the
 * next waiter. Lower `priority` goes first. A request aborted while still
 * waiting never runs at all.
 *
 * The limit is applied inside `connection.query`, around the fetch itself, so
 * every request is subject to it and no request can be queued while the task
 * issuing it already holds a place.
 */

/** Requests allowed to run at once. */
export const MAX_CONCURRENT_REQUESTS = 24;

/** Which request goes first when more are waiting than can run. Lower first. */
export const PRIORITY = {
    /** Someone is waiting on the answer. */
    interactive: 0,
    /** The region currently being read. */
    window: 1,
    /** Bulk work, which fills in behind everything else. */
    map: 2,
} as const;

let active = 0;
const waiting: { priority: number; resume: () => void }[] = [];

/**
 * Takes a place if one is free, otherwise returns a promise that resolves once
 * a place is handed over.
 *
 * A finishing task hands its place straight to the next waiter. Decrementing
 * first would let a caller arriving in between take the free place as well,
 * and the cap would drift up by one for every hand-over.
 */
function acquire(priority: number): Promise<void> | undefined {
    if (active < MAX_CONCURRENT_REQUESTS) {
        active++;
        return undefined;
    }
    return new Promise<void>((resume) => waiting.push({ priority, resume }));
}

function release(): void {
    if (waiting.length === 0) {
        active--;
        return;
    }
    // Lowest priority first, and first-come within a priority.
    let best = 0;
    for (let index = 1; index < waiting.length; index++) {
        if (waiting[index].priority < waiting[best].priority) {
            best = index;
        }
    }
    waiting.splice(best, 1)[0].resume();
}

/** Read through a call so narrowing does not carry across the await. */
function isAborted(signal: AbortSignal | undefined): boolean {
    // Deliberately not `signal?.aborted === true`: see the comment above — this
    // function's whole point is a call boundary, not the shortest expression.
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    return signal !== undefined && signal.aborted;
}

/**
 * Runs `run` once a place is free and releases the place when it settles.
 *
 * Throws `AbortError` without running anything if `signal` is already aborted,
 * or becomes aborted while waiting.
 */
export async function withRequestLimit<T>(
    signal: AbortSignal | undefined,
    run: () => Promise<T>,
    priority: number = PRIORITY.window,
): Promise<T> {
    if (isAborted(signal)) {
        throw abortError();
    }
    const queued = acquire(priority);
    if (queued !== undefined) {
        await queued;
    }
    // Checked again: the caller may have abandoned the request while it queued.
    if (isAborted(signal)) {
        release();
        throw abortError();
    }
    try {
        return await run();
    } finally {
        release();
    }
}

/** Requests currently running. For tests. */
export function activeRequestCount(): number {
    return active;
}

function abortError(): Error {
    return typeof DOMException === 'function'
        ? new DOMException('Aborted', 'AbortError')
        : Object.assign(new Error('Aborted'), { name: 'AbortError' });
}
