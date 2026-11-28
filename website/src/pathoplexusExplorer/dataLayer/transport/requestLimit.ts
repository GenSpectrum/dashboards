/** Share the available request slots across all Explorer reads, in arrival order. */
export const MAX_CONCURRENT_REQUESTS = 24;

let active = 0;
const waiting = new Set<() => void>();

export async function withRequestLimit<T>(signal: AbortSignal | undefined, run: () => Promise<T>): Promise<T> {
    signal?.throwIfAborted();
    if (active < MAX_CONCURRENT_REQUESTS) {
        active++;
    } else {
        await new Promise<void>((resolve, reject) => {
            function resume() {
                waiting.delete(resume);
                signal?.removeEventListener('abort', cancel);
                resolve();
            }
            function cancel() {
                waiting.delete(resume);
                reject(signal?.reason instanceof Error ? signal.reason : new DOMException('Aborted', 'AbortError'));
            }
            waiting.add(resume);
            signal?.addEventListener('abort', cancel, { once: true });
        });
    }
    try {
        signal?.throwIfAborted();
        return await run();
    } finally {
        // Hand the occupied slot to the next caller before admitting another request.
        const next = waiting.values().next().value;
        if (next === undefined) {
            active--;
        } else {
            next();
        }
    }
}
