import { expect, test } from 'vitest';

import { entryTermsOf } from './useEntries.ts';

test('the entries are counted in all, and those under the Restricted-Use Terms again', () => {
    expect(
        entryTermsOf([
            { dataUseTerms: 'OPEN', n: 40 },
            { dataUseTerms: 'RESTRICTED', n: 2 },
        ]),
    ).toEqual({
        total: 42,
        restricted: 2,
    });
});

test('terms the data does not record count towards the total and not towards the restricted', () => {
    expect(
        entryTermsOf([
            { dataUseTerms: null, n: 3 },
            { dataUseTerms: 'OPEN', n: 1 },
        ]),
    ).toEqual({
        total: 4,
        restricted: 0,
    });
});

test('no entries at all is no entries, rather than nothing to say', () => {
    expect(entryTermsOf([])).toEqual({ total: 0, restricted: 0 });
});
