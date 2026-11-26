import { afterEach, describe, expect, test, vi } from 'vitest';

import { connect } from './connection.ts';
import { field, str } from './expression.ts';
import { REQUEST_HEADERS } from './query.ts';
import { table, type Queryable } from './relation.ts';

const connection = connect({ url: 'https://example.org/pathoplexus/' });

afterEach(() => vi.unstubAllGlobals());

function answering(...bodies: string[]) {
    const fetched: RequestInit[] = [];
    const responses = [...bodies];
    vi.stubGlobal(
        'fetch',
        vi.fn((_url: string, init: RequestInit) => {
            fetched.push(init);
            return Promise.resolve(
                new Response(responses.shift() ?? '', {
                    status: 200,
                    headers: new Headers([['data-version', '1794406860']]),
                }),
            );
        }),
    );
    return fetched;
}

describe('a connection', () => {
    test('carries the identity that every cache entry needs', () => {
        expect(connection.url).toBe('https://example.org/pathoplexus/');
        expect(connection.key).toEqual(['https://example.org/pathoplexus/']);
        expect(connection.id).toBe('https://example.org/pathoplexus/');
    });

    test('sends a relation and text alike, with the headers of a simple request', async () => {
        const fetched = answering('{"n":1}\n', '{"n":1}\n');

        await connection.query(table('mpox').filter(field('clade').eq(str('Ib'))), 'Test');
        await connection.query('mpox.limit(1)', 'Test');

        expect(fetched.map((init) => init.body)).toEqual(["mpox.filter(clade = 'Ib')", 'mpox.limit(1)']);
        for (const init of fetched) {
            expect(init.headers).toEqual(REQUEST_HEADERS);
        }
    });

    test('gives the rows of a query with compact column names back under their original names', async () => {
        answering('{"c0":"Uganda","n":7}\n');
        const compact: Queryable = {
            render: () => 'mpox.group(by := {c0}, aggs := {n := count()})',
            decode: (rows) => rows.map(({ c0, ...rest }) => ({ geoLocCountry: c0, ...rest })),
        };

        await expect(connection.query(compact, 'Places')).resolves.toEqual({
            rows: [{ geoLocCountry: 'Uganda', n: 7 }],
            dataVersion: '1794406860',
        });
    });

    test('takes the data version from a response of the instance', async () => {
        answering('{"name":"andv_L"}\n');

        await expect(connection.dataVersion()).resolves.toBe('1794406860');
    });

    test('offers the curl line for what it would send', () => {
        const command = connection.curl(table('mpox').limit(1));
        expect(command).toContain("'https://example.org/pathoplexus/query'");
        expect(command).toContain("--data-binary 'mpox.limit(1)'");
        expect(command).toContain("-H 'Content-Type: text/plain'");
    });
});
