import { afterEach, expect, test, vi } from 'vitest';

import { connect } from './connection.ts';
import { field, str } from './expression.ts';
import { table, type Queryable } from './relation.ts';

const connection = connect({ url: 'https://example.org/pathoplexus' });

afterEach(() => vi.unstubAllGlobals());

function answering(body: string) {
    const fetching = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(body, { headers: new Headers([['data-version', '1794406860']]) }));
    vi.stubGlobal('fetch', fetching);
    return fetching;
}

test('a relation is sent as the text it renders to', async () => {
    const fetching = answering('{"n":1}\n');

    await connection.query(table('mpox').filter(field('clade').eq(str('Ib'))), 'Test');

    expect(fetching).toHaveBeenCalledWith(
        'https://example.org/pathoplexus/query',
        expect.objectContaining({ body: "mpox.filter(clade = 'Ib')" }),
    );
});

test('the rows of a query with compact column names come back under their original names', async () => {
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

test('the data version is that of any answer from the instance', async () => {
    answering('{"name":"andv_L"}\n');

    await expect(connection.dataVersion()).resolves.toBe('1794406860');
});
