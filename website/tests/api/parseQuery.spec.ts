import { expect, test } from '@playwright/test';

import { parseQuery } from '../../src/lapis/parseQuery.ts';

test.describe('parseQuery integration', () => {
    const LAPIS_URL = 'https://lapis.cov-spectrum.org/open/v2';

    test('should parse a simple query against real LAPIS', async () => {
        const queries = ["country = 'Switzerland'"];

        const result = await parseQuery(LAPIS_URL, queries);

        expect(result).toHaveLength(1);
        expect(result[0].type).toBe('success');
        if (result[0].type === 'success') {
            expect(result[0].filter.type).toBe('StringEquals');
        }
    });

    test('should handle invalid query syntax', async () => {
        const queries = ['this is invalid syntax !!!!'];

        const result = await parseQuery(LAPIS_URL, queries);

        expect(result).toHaveLength(1);
        expect(result[0].type).toBe('failure');
        if (result[0].type === 'failure') {
            expect(result[0].error).toBeTruthy();
            expect(typeof result[0].error).toBe('string');
        }
    });
});
