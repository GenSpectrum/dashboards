import type { LapisFilter } from '@genspectrum/dashboard-components/util';
import { describe, expect, test } from 'vitest';

import { assembleDownloadUrl } from './assembleDownloadUrl.ts';

describe('assembleDownloadUrl', () => {
    test('should return a valid URL', () => {
        const result = assembleDownloadUrl(['accession1', 'accession2'], {}, 'my_filename', 'https://my.lapis.com');

        expect(result).to.equal(
            'https://my.lapis.com/sample/details?fields=accession1&fields=accession2&dataFormat=tsv&downloadAsFile=true&downloadFileBasename=my_filename',
        );
    });

    for (const [filterKey, filterValue, expectedUrlPart] of [
        ['stringValue', 'myStringValue', 'stringValue=myStringValue'],
        ['numberValue', 42, 'numberValue=42'],
        ['arrayValue', ['item1', 'item2'], 'arrayValue=item1&arrayValue=item2'],
        ['trueBoolean', true, 'trueBoolean=true'],
        ['falseBoolean', false, 'falseBoolean=false'],
    ] satisfies [string, LapisFilter[string], string][]) {
        test(`should put ${filterKey} LAPIS filter into the URL`, () => {
            const lapisFilter = { [filterKey]: filterValue };

            const result = assembleDownloadUrl(['accession'], lapisFilter, 'my_filename', 'https://my.lapis.com');

            expect(result).to.contain(expectedUrlPart);
        });
    }

    test('should ignore null and undefined values', () => {
        const result = assembleDownloadUrl(
            ['accession'],
            {
                undefinedValue: undefined,
                nullValue: null,
            },
            'my_filename',
            'https://my.lapis.com',
        );

        expect(result).not.to.contain('undefinedValue=');
        expect(result).not.to.contain('nullValue=');
    });
});
