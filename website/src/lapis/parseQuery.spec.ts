import { beforeEach, describe, expect, test } from 'vitest';

import { parseQuery } from './parseQuery.ts';
import { DUMMY_LAPIS_URL } from '../../routeMocker.ts';
import { astroApiRouteMocker, lapisRouteMocker } from '../../vitest.setup.ts';

describe('parseQuery', () => {
    beforeEach(() => {
        astroApiRouteMocker.mockLog();
    });

    test('should parse a valid query', async () => {
        const queries = ["country = 'USA'"];

        lapisRouteMocker.mockPostQueryParse(
            { queries },
            {
                data: [
                    {
                        type: 'success',
                        filter: {
                            type: 'StringEquals',
                            column: 'country',
                            value: 'USA',
                        },
                    },
                ],
            },
        );

        const result = await parseQuery(DUMMY_LAPIS_URL, queries);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            type: 'success',
            filter: {
                type: 'StringEquals',
                column: 'country',
                value: 'USA',
            },
        });
    });

    test('should handle failed query parsing', async () => {
        const queries = ['invalid query syntax'];

        lapisRouteMocker.mockPostQueryParse(
            { queries },
            {
                data: [
                    {
                        type: 'failure',
                        error: 'Parse error',
                    },
                ],
            },
        );

        const result = await parseQuery(DUMMY_LAPIS_URL, queries);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            type: 'failure',
            error: 'Parse error',
        });
    });

    test('should throw when LAPIS request fails', async () => {
        const queries = ["country = 'USA'"];

        lapisRouteMocker.mockPostQueryParse({ queries }, { data: [] }, 500);

        await expect(parseQuery(DUMMY_LAPIS_URL, queries)).rejects.toThrow(/Failed to parse queries/);
    });

    test('should throw when LAPIS returns unexpected data', async () => {
        const queries = ["country = 'USA'"];

        // @ts-expect-error -- intentionally passing wrong data
        lapisRouteMocker.mockPostQueryParse({ queries }, { data: 'something unexpected' });

        await expect(parseQuery(DUMMY_LAPIS_URL, queries)).rejects.toThrow(/Failed to parse query response/);
    });
});
