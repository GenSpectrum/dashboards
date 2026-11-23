import { afterEach, expect, test, vi } from 'vitest';

import { initRhydb, readRows } from './rhydb.ts';
import { groupAcross } from '../queries/builders.ts';
import { COLUMNS } from '../queries/scope.ts';

const INSTANCE = 'https://rhydb.example.org/pathoplexus';

function answers(body: string) {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(body, { status: 200 })));
}

afterEach(() => {
    vi.unstubAllGlobals();
});

test('a read that asked for short column names answers under the names that a panel uses', async () => {
    initRhydb(INSTANCE);
    answers('{"c0":"2024-01-01","c1":"2024-01-31","n":3}\n');

    const query = groupAcross({
        tables: ['mpox'],
        filter: () => undefined,
        columns: [COLUMNS.lower, COLUMNS.upper],
        compact: true,
    });

    await expect(readRows(query, 'Over time')).resolves.toEqual([
        { [COLUMNS.lower]: '2024-01-01', [COLUMNS.upper]: '2024-01-31', n: 3 },
    ]);
});

test('a read that asked for the full names is passed through as it came', async () => {
    initRhydb(INSTANCE);
    answers('{"geoLocCountry":"Uganda","n":7}\n');

    const query = groupAcross({ tables: ['mpox'], filter: () => undefined, columns: [COLUMNS.country] });

    await expect(readRows(query, 'Places')).resolves.toEqual([{ geoLocCountry: 'Uganda', n: 7 }]);
});
