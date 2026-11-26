import { expect, test } from 'vitest';

import { accessionListFilename, accessionListOf } from './accessionList.ts';

test('the file names its columns and holds one row per entry', () => {
    const file = accessionListOf([
        {
            accessionVersion: 'PP_2.1',
            dataUseTerms: 'RESTRICTED',
            dataUseTermsRestrictedUntil: '2027-05-21',
            dataUseTermsUrl: 'https://pathoplexus.org/about/terms-of-use/restricted-data',
        },
        {
            accessionVersion: 'PP_1.1',
            dataUseTerms: 'OPEN',
            dataUseTermsRestrictedUntil: null,
            dataUseTermsUrl: 'https://pathoplexus.org/about/terms-of-use/open-data',
        },
    ]);
    expect(file.split('\n')).toEqual([
        'accessionVersion\tdataUseTerms\tdataUseTermsRestrictedUntil\tdataUseTermsUrl',
        'PP_1.1\tOPEN\t\thttps://pathoplexus.org/about/terms-of-use/open-data',
        'PP_2.1\tRESTRICTED\t2027-05-21\thttps://pathoplexus.org/about/terms-of-use/restricted-data',
        '',
    ]);
});

test('nothing a value holds can break a row or a column', () => {
    const file = accessionListOf([{ accessionVersion: 'PP_1.1\tx', dataUseTerms: 'OPEN\nRESTRICTED' }]);
    expect(file.split('\n')[1]).toBe('PP_1.1 x\tOPEN RESTRICTED\t\t');
});

test('the file is named after the day it was asked for and the data version it came from', () => {
    const day = new Date('2026-11-16T09:30:00Z');
    expect(accessionListFilename(day, '1795496867')).toBe('pathoplexus-accessions-2026-11-16-data-1795496867.tsv');
    expect(accessionListFilename(day, null)).toBe('pathoplexus-accessions-2026-11-16.tsv');
});
