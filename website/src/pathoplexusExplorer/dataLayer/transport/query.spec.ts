import { afterEach, expect, test, vi } from 'vitest';

import { curlFor, query, RhydbError } from './query.ts';

const INSTANCE = 'https://rhydb.example.org/pathoplexus';

function answer(body: string, init: { status?: number } = {}): Response {
    return new Response(body, { status: init.status ?? 200 });
}

function answersWith(...responses: Response[]) {
    const fetching = vi.fn<typeof fetch>();
    for (const response of responses) {
        fetching.mockResolvedValueOnce(response);
    }
    vi.stubGlobal('fetch', fetching);
    return fetching;
}

afterEach(() => {
    vi.unstubAllGlobals();
});

async function rowsOf(queryText: string, signal?: AbortSignal) {
    return (await query(INSTANCE, queryText, 'Test panel', signal)).rows;
}

async function failureOf(queryText: string): Promise<RhydbError> {
    const failure = await rowsOf(queryText).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(RhydbError);
    return failure as RhydbError;
}

test('a query is posted to the instance, and its NDJSON answer read a row per line', async () => {
    const fetching = answersWith(answer('{"n":2}\n{"n":3}\n'));

    await expect(rowsOf('mpox.group(by := {}, aggs := {n := count()})')).resolves.toEqual([{ n: 2 }, { n: 3 }]);
    expect(fetching).toHaveBeenCalledWith(
        'https://rhydb.example.org/pathoplexus/query',
        expect.objectContaining({ method: 'POST', body: 'mpox.group(by := {}, aggs := {n := count()})' }),
    );
});

test('an answer of no rows is no rows, not an error', async () => {
    answersWith(answer(''));

    await expect(rowsOf('mpox')).resolves.toEqual([]);
});

test('a rejected query carries the reason the instance gave', async () => {
    answersWith(answer('{"error":"Bad request","message":"no such column"}', { status: 400 }));

    const failure = await failureOf('mpox.filter(nope = 1)');

    expect(failure.kind).toBe('invalid-query');
    expect(failure.message).toBe('no such column');
});

test('a failure names the part of the page that asked, and a rejected query is not sent again', async () => {
    const fetching = answersWith(answer('{"message":"parse error"}', { status: 400 }));

    const failure = await failureOf('nonsense');

    expect(failure.label).toBe('Test panel');
    expect(failure.userMessage).toBe('Test panel: The query was rejected by RhyDB: parse error');
    expect(failure.unexpected).toBe(true);
    expect(fetching).toHaveBeenCalledTimes(1);
});

test('a query the instance times out on asks the reader to narrow the selection, and is not retried', async () => {
    const fetching = answersWith(answer('<html>gateway timeout</html>', { status: 504 }));

    const failure = await failureOf('mpox');

    expect(failure.kind).toBe('too-expensive');
    expect(failure.userMessage).toContain('Narrow the selection');
    expect(fetching).toHaveBeenCalledTimes(1);
});

test('an instance that is not answering yet is tried again, and the second answer is used', async () => {
    const fetching = answersWith(answer('starting up', { status: 503 }), answer('{"n":1}\n'));

    await expect(rowsOf('mpox')).resolves.toEqual([{ n: 1 }]);
    expect(fetching).toHaveBeenCalledTimes(2);
});

test('an instance that cannot be reached is tried again, and the failure named if it stays unreachable', async () => {
    const fetching = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetching);

    const failure = await failureOf('mpox');

    expect(failure.kind).toBe('network');
    expect(failure.message).toBe('Failed to fetch');
    expect(fetching).toHaveBeenCalledTimes(3);
});

test('an answer that is not NDJSON is reported as a failed request rather than parsed', async () => {
    answersWith(answer('<html>proxy error</html>'));

    const failure = await failureOf('mpox');

    expect(failure.kind).toBe('http');
    expect(failure.message).toBe('The response was not valid NDJSON.');
});

test('the data version is read from the same response as the rows', async () => {
    answersWith(new Response('{"name":"andv_L"}\n', { headers: new Headers([['data-version', '1794406860']]) }));

    await expect(query(INSTANCE, 'reference_genomes.project({name}).limit(1)', 'Test panel')).resolves.toEqual({
        rows: [{ name: 'andv_L' }],
        dataVersion: '1794406860',
    });
});

function interrupted(): Response {
    const body = new ReadableStream<Uint8Array>({
        start(controller) {
            controller.enqueue(new TextEncoder().encode('{"n":1}\n'));
            controller.error(new TypeError('network error'));
        },
    });
    return new Response(body, { status: 200 });
}

test('an answer that breaks off is tried again like an instance that cannot be reached', async () => {
    const fetching = answersWith(interrupted(), answer('{"n":1}\n'));

    await expect(rowsOf('mpox')).resolves.toEqual([{ n: 1 }]);
    expect(fetching).toHaveBeenCalledTimes(2);
});

test('an answer that keeps breaking off is reported as a network failure', async () => {
    answersWith(interrupted(), interrupted(), interrupted());

    const failure = await failureOf('mpox');

    expect(failure.kind).toBe('network');
});

test('an abandoned request is not retried', async () => {
    const controller = new AbortController();
    const fetching = vi.fn<typeof fetch>().mockImplementation(() => {
        controller.abort();
        return Promise.reject(new DOMException('Aborted', 'AbortError'));
    });
    vi.stubGlobal('fetch', fetching);

    await expect(rowsOf('mpox', controller.signal)).rejects.toBeInstanceOf(DOMException);
    expect(fetching).toHaveBeenCalledTimes(1);
});

test('the curl line carries the endpoint, the headers and the query', () => {
    const command = curlFor(INSTANCE, 'mpox.limit(1)');

    expect(command).toContain("'https://rhydb.example.org/pathoplexus/query'");
    expect(command).toContain("-H 'Content-Type: text/plain'");
    expect(command).toContain("--data-binary 'mpox.limit(1)'");
});
