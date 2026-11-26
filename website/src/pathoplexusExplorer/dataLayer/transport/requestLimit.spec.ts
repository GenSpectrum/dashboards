import { describe, expect, test } from 'vitest';

import { activeRequestCount, MAX_CONCURRENT_REQUESTS, PRIORITY, withRequestLimit } from './requestLimit.ts';

function deferred() {
    let resolve!: () => void;
    const promise = new Promise<void>((settle) => {
        resolve = settle;
    });
    return { promise, resolve };
}

describe('withRequestLimit', () => {
    test('never lets more than the cap run at once', async () => {
        const blockers = Array.from({ length: 40 }, () => deferred());
        let running = 0;
        let peak = 0;

        const tasks = blockers.map((blocker) =>
            withRequestLimit(undefined, async () => {
                running++;
                peak = Math.max(peak, running);
                await blocker.promise;
                running--;
            }),
        );

        // Released one at a time, so each place is handed over.
        await Promise.resolve();
        expect(peak).toBe(MAX_CONCURRENT_REQUESTS);
        for (const blocker of blockers) {
            blocker.resolve();
            await Promise.resolve();
        }
        await Promise.all(tasks);

        expect(peak).toBe(MAX_CONCURRENT_REQUESTS);
        expect(activeRequestCount()).toBe(0);
    });

    test('every queued task eventually runs', async () => {
        const done: number[] = [];
        await Promise.all(
            Array.from({ length: 50 }, (_, index) =>
                withRequestLimit(undefined, () => {
                    done.push(index);
                    return Promise.resolve();
                }),
            ),
        );
        expect(done).toHaveLength(50);
        expect(activeRequestCount()).toBe(0);
    });

    test('a task aborted before it starts never issues its request', async () => {
        const controller = new AbortController();
        controller.abort();
        let ran = false;
        await expect(
            withRequestLimit(controller.signal, () => {
                ran = true;
                return Promise.resolve();
            }),
        ).rejects.toThrow();
        expect(ran).toBe(false);
    });

    test('a task aborted while queued never issues either, and gives its place back', async () => {
        const blockers = Array.from({ length: MAX_CONCURRENT_REQUESTS }, () => deferred());
        const holders = blockers.map((blocker) => withRequestLimit(undefined, () => blocker.promise));
        await Promise.resolve();

        const controller = new AbortController();
        let ran = false;
        const queued = withRequestLimit(controller.signal, () => {
            ran = true;
            return Promise.resolve();
        });
        controller.abort();

        for (const blocker of blockers) {
            blocker.resolve();
        }
        await Promise.all(holders);
        await expect(queued).rejects.toThrow();
        expect(ran).toBe(false);
        expect(activeRequestCount()).toBe(0);
    });

    test('the window jumps the queue ahead of the map', async () => {
        // A large background sweep must not hold the limit against a small
        // one someone is waiting on.
        const blockers = Array.from({ length: MAX_CONCURRENT_REQUESTS }, () => deferred());
        const holders = blockers.map((blocker) => withRequestLimit(undefined, () => blocker.promise, PRIORITY.map));
        await Promise.resolve();

        const order: string[] = [];
        const queued = [
            withRequestLimit(undefined, () => Promise.resolve(void order.push('map-1')), PRIORITY.map),
            withRequestLimit(undefined, () => Promise.resolve(void order.push('map-2')), PRIORITY.map),
            withRequestLimit(undefined, () => Promise.resolve(void order.push('window')), PRIORITY.window),
        ];

        for (const blocker of blockers) {
            blocker.resolve();
        }
        await Promise.all([...holders, ...queued]);

        expect(order[0]).toBe('window');
        expect(activeRequestCount()).toBe(0);
    });

    test('a failing task releases its place', async () => {
        await expect(withRequestLimit(undefined, () => Promise.reject(new Error('instance said no')))).rejects.toThrow(
            'instance said no',
        );
        expect(activeRequestCount()).toBe(0);
    });
});

describe('the priority ladder', () => {
    test('runs startup before a window, and a window before the map', () => {
        // Priority decides, not arrival order.
        expect(PRIORITY.interactive).toBeLessThan(PRIORITY.window);
        expect(PRIORITY.window).toBeLessThan(PRIORITY.map);
    });
});
