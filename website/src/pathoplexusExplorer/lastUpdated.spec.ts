import { expect, test } from 'vitest';

import { formatDataVersion } from './lastUpdated.ts';

test('the download time is formatted in UTC with a full month and 24-hour time', () => {
    const version = String(Date.parse('2026-11-11T14:21:00Z') / 1000);
    expect(formatDataVersion(version)).toBe('11 November 2026, 14:21 UTC');
    expect(formatDataVersion(String(Date.parse('2026-01-01T00:05:00Z') / 1000))).toBe('1 January 2026, 00:05 UTC');
});

test('a missing or invalid version cannot be displayed as a download time', () => {
    for (const version of [null, '', 'invalid', 'Infinity', '999999999999999999']) {
        expect(formatDataVersion(version)).toBeUndefined();
    }
});
