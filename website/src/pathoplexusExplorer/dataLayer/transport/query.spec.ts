import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { query, RhydbError } from './query.ts';

const INSTANCE = 'https://rhydb.example.org/pathoplexus/';

function answer(body: string, status = 200): Response {
    return new Response(body, { status });
}

function answersWith(...responses: Response[]) {
    const fetching = vi.fn<typeof fetch>();
    for (const response of responses) {
        fetching.mockResolvedValueOnce(response);
    }
    vi.stubGlobal('fetch', fetching);
    return fetching;
}

function unreachable() {
    const fetching = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetching);
    return fetching;
}

/** An answer that breaks off after its first row. */
function interrupted(): Response {
    const body = new ReadableStream<Uint8Array>({
        start(controller) {
            controller.enqueue(new TextEncoder().encode('{"n":1}\n'));
            controller.error(new TypeError('network error'));
        },
    });
    return new Response(body, { status: 200 });
}

/** Runs a query to its end, the waits between retries included. */
async function settled(queryText: string, signal?: AbortSignal) {
    const result = query(INSTANCE, queryText, 'Test panel', signal).then(
        (answered) => ({ rows: answered.rows, failure: undefined }),
        (failure: unknown) => ({ rows: undefined, failure }),
    );
    await vi.runAllTimersAsync();
    return result;
}

async function failureOf(queryText: string): Promise<RhydbError> {
    const { failure } = await settled(queryText);
    expect(failure).toBeInstanceOf(RhydbError);
    return failure as RhydbError;
}

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

test('a query is posted as a simple request, and its NDJSON answer read a row per line', async () => {
    const fetching = answersWith(answer('{"n":2}\n{"n":3}\n'));

    expect((await settled('mpox.limit(2)')).rows).toEqual([{ n: 2 }, { n: 3 }]);
    expect(fetching).toHaveBeenCalledWith('https://rhydb.example.org/pathoplexus/query', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain', 'Accept': 'application/x-ndjson' }, // eslint-disable-line @typescript-eslint/naming-convention -- HTTP header names
        body: 'mpox.limit(2)',
        signal: expect.any(AbortSignal) as AbortSignal,
    });
});

test('an answer of no rows is no rows, not an error', async () => {
    answersWith(answer(''));

    expect((await settled('mpox')).rows).toEqual([]);
});

test('the data version is taken from the same response as the rows', async () => {
    answersWith(new Response('{"n":1}\n', { headers: new Headers([['data-version', '1794406860']]) }));

    await expect(query(INSTANCE, 'mpox', 'Test panel')).resolves.toEqual({
        rows: [{ n: 1 }],
        dataVersion: '1794406860',
    });
});

test('a rejected query is sent once, and its failure carries the reason and the part of the page that asked', async () => {
    const fetching = answersWith(answer('{"error":"Bad request","message":"no such column"}', 400));

    const failure = await failureOf('mpox.filter(nope = 1)');

    expect(failure.kind).toBe('invalid-query');
    expect(failure.userMessage).toBe('Test panel: The query was rejected by RhyDB: no such column');
    expect(failure.unexpected).toBe(true);
    expect(fetching).toHaveBeenCalledTimes(1);
});

test('a query the instance times out on asks the reader to narrow the selection, and is not sent again', async () => {
    const fetching = answersWith(answer('<html>gateway timeout</html>', 504));

    const failure = await failureOf('mpox');

    expect(failure.kind).toBe('too-expensive');
    expect(failure.userMessage).toContain('Narrow the selection');
    expect(fetching).toHaveBeenCalledTimes(1);
});

test.each([502, 503])('an instance that is not answering yet (HTTP %i) is tried again', async (status) => {
    const fetching = answersWith(answer('starting up', status), answer('{"n":1}\n'));

    expect((await settled('mpox')).rows).toEqual([{ n: 1 }]);
    expect(fetching).toHaveBeenCalledTimes(2);
});

test('an instance that stays unreachable is tried three times, then named as unreachable', async () => {
    const fetching = unreachable();

    const failure = await failureOf('mpox');

    expect(failure.kind).toBe('network');
    expect(failure.message).toBe('Failed to fetch');
    expect(fetching).toHaveBeenCalledTimes(3);
});

test('an answer that breaks off is tried again like an instance that cannot be reached', async () => {
    const fetching = answersWith(interrupted(), answer('{"n":1}\n'));

    expect((await settled('mpox')).rows).toEqual([{ n: 1 }]);
    expect(fetching).toHaveBeenCalledTimes(2);
});

test.each(['<html>proxy error</html>', 'null', '[{}]', '{"n":1}\n4'])(
    'rejects a response containing an invalid row: %s',
    async (body) => {
        answersWith(answer(body));

        const failure = await failureOf('mpox');

        expect(failure.kind).toBe('http');
        expect(failure.message).toBe('The response was not valid NDJSON.');
    },
);

test('a request abandoned while it waits to be tried again is not tried again', async () => {
    const fetching = unreachable();
    const controller = new AbortController();

    const running = query(INSTANCE, 'mpox', 'Test panel', controller.signal);
    await vi.advanceTimersByTimeAsync(0);
    controller.abort();

    await expect(running).rejects.toBeInstanceOf(DOMException);
    expect(fetching).toHaveBeenCalledTimes(1);
});
