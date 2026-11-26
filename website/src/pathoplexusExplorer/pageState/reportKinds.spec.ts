import { expect, test } from 'vitest';

import { scopeLine } from './reportKinds.ts';
import { WORLD } from '../domain/geography.ts';

const WRITTEN_ON = '2026-11-19';

const worldwide = (from?: string, to?: string) =>
    scopeLine({ kind: 'location', where: WORLD, period: { from, to } }, WRITTEN_ON);

test('a period with both ends names both of them', () => {
    expect(worldwide('2016-11-19', '2017-01-02')).toBe('collected between 19 November 2016 and 2 January 2017');
});

test('a period open at its end names the day that the report is written', () => {
    expect(worldwide('2016-11-19')).toBe('collected between 19 November 2016 and 19 November 2026');
});

test('a period open at its start names its end alone', () => {
    expect(worldwide(undefined, '2017-01-02')).toBe('collected up to 2 January 2017');
});

test('a report over every collection date says so', () => {
    expect(worldwide()).toBe('all collection dates');
});
