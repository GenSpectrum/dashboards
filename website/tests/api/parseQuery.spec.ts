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

    test('should handle mixed valid and invalid queries (partial results)', async () => {
        const queries = [
            "country = 'Switzerland'", // valid
            'invalid syntax !!!', // invalid
            "pangoLineage = 'BA.1*'", // valid
        ];

        const result = await parseQuery(LAPIS_URL, queries);

        // Should get 3 results total (HTTP 200 with partial results)
        expect(result).toHaveLength(3);

        // First should be success
        expect(result[0].type).toBe('success');
        if (result[0].type === 'success') {
            expect(result[0].filter.type).toBe('StringEquals');
        }

        // Second should be failure
        expect(result[1].type).toBe('failure');
        if (result[1].type === 'failure') {
            expect(result[1].error).toBeTruthy();
        }

        // Third should be success
        expect(result[2].type).toBe('success');
        if (result[2].type === 'success') {
            expect(result[2].filter.type).toBe('Lineage');
        }
    });

    test('should parse deeply nested expressions (3 levels)', async () => {
        const queries = [
            "(country = 'Switzerland' | country = 'Germany') & ((age >= 30 & age <= 50) | pangoLineage = 'BA.1*')",
        ];

        const result = await parseQuery(LAPIS_URL, queries);

        expect(result).toHaveLength(1);
        expect(result[0].type).toBe('success');

        if (result[0].type === 'success') {
            // Top level should be And
            expect(result[0].filter.type).toBe('And');

            if (result[0].filter.type === 'And') {
                expect(result[0].filter.children).toBeDefined();
                expect(result[0].filter.children.length).toBeGreaterThan(0);

                // Should have nested Or/And expressions
                const hasNestedExpression = result[0].filter.children.some(
                    (child) => child.type === 'Or' || child.type === 'And',
                );
                expect(hasNestedExpression).toBe(true);
            }
        }
    });
});
