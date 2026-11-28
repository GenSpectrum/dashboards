import { describe, expect, test } from 'vitest';

import { MAX_CONCURRENT_REQUESTS, withRequestLimit } from './requestLimit.ts';

function deferred() {
    let resolve!: () => void;
    const promise = new Promise<void>((settle) => {
        resolve = settle;
    });
    return { promise, resolve };
}

/** Fills every place with a task that runs until it is released. */
async function fillEveryPlace() {
    const blockers = Array.from({ length: MAX_CONCURRENT_REQUESTS }, () => deferred());
    const holders = blockers.map((blocker) => withRequestLimit(undefined, () => blocker.promise));
    await Promise.resolve();
    return {
        release: async () => {
            blockers.forEach((blocker) => blocker.resolve());
            await Promise.all(holders);
        },
    };
}

describe('withRequestLimit', () => {
    test('never lets more than the cap run at once, and runs every task in the end', async () => {
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

        await Promise.resolve();
        expect(running).toBe(MAX_CONCURRENT_REQUESTS);
        for (const blocker of blockers) {
            blocker.resolve();
            await Promise.resolve();
        }
        await Promise.all(tasks);

        expect(peak).toBe(MAX_CONCURRENT_REQUESTS);
        expect(running).toBe(0);
    });

    test('runs the waiting tasks in the order they came', async () => {
        const places = await fillEveryPlace();
        const order: number[] = [];
        const queued = [1, 2, 3].map((index) =>
            withRequestLimit(undefined, () => Promise.resolve(void order.push(index))),
        );

        await places.release();
        await Promise.all(queued);

        expect(order).toEqual([1, 2, 3]);
    });

    test('a task aborted before it starts never issues its request', async () => {
        let ran = false;

        await expect(
            withRequestLimit(AbortSignal.abort(), () => {
                ran = true;
                return Promise.resolve();
            }),
        ).rejects.toThrow();

        expect(ran).toBe(false);
    });

    test('a task aborted while it waits never issues its request, and passes its place on', async () => {
        const places = await fillEveryPlace();
        const controller = new AbortController();
        let ran = false;
        const aborted = withRequestLimit(controller.signal, () => {
            ran = true;
            return Promise.resolve();
        });
        const next = withRequestLimit(undefined, () => Promise.resolve('next'));
        controller.abort();

        await expect(aborted).rejects.toThrow();
        await places.release();
        await expect(next).resolves.toBe('next');
        expect(ran).toBe(false);
    });

    test('a failing task gives its place back', async () => {
        const failures = Array.from({ length: MAX_CONCURRENT_REQUESTS }, () =>
            withRequestLimit(undefined, () => Promise.reject(new Error('instance said no'))),
        );
        await Promise.allSettled(failures);

        await expect(withRequestLimit(undefined, () => Promise.resolve('ran'))).resolves.toBe('ran');
    });
});
