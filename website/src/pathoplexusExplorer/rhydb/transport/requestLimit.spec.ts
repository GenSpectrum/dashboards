import { expect, test } from 'vitest';

import { withRequestLimit } from './requestLimit.ts';

function held() {
    let finish = (): void => undefined;
    const settled = new Promise<void>((resolve) => {
        finish = () => resolve();
    });
    return { run: () => settled, finish };
}

const LIMIT = 24;

test('requests beyond the limit wait, and start as the ones before them finish', async () => {
    const running = held();
    const started: number[] = [];
    const places = Array.from({ length: LIMIT }, () => held());
    const open = places.map((place) => withRequestLimit(undefined, place.run));

    const queued = withRequestLimit(undefined, async () => {
        started.push(1);
        await running.run();
    });
    await Promise.resolve();
    expect(started).toEqual([]);

    places[0].finish();
    await places[0].run();
    await Promise.resolve();
    expect(started).toEqual([1]);

    running.finish();
    places.slice(1).forEach((place) => place.finish());
    await Promise.all([...open, queued]);
});

test('a request whose caller has already given up never runs', async () => {
    const signal = AbortSignal.abort();
    let ran = false;

    await expect(
        withRequestLimit(signal, () => {
            ran = true;
            return Promise.resolve('rows');
        }),
    ).rejects.toThrow();
    expect(ran).toBe(false);
});

test('a place is handed back even when the request fails', async () => {
    await expect(withRequestLimit(undefined, () => Promise.reject(new Error('rejected')))).rejects.toThrow('rejected');
    await expect(withRequestLimit(undefined, () => Promise.resolve('rows'))).resolves.toBe('rows');
});
