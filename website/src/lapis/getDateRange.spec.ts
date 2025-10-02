import { beforeEach, describe, expect, test } from 'vitest';

import { getDateRange } from './getDateRange.ts';
import { DUMMY_LAPIS_URL } from '../../routeMocker.ts';
import { astroApiRouteMocker, lapisRouteMocker } from '../../vitest.setup.ts';

describe('getDateRange', () => {
    beforeEach(() => {
        astroApiRouteMocker.mockLog();
    });

    test('should return start and end dates', async () => {
        const fieldName = 'collectionDate';

        lapisRouteMocker.mockPostAggregated(
            { fields: [fieldName], orderBy: [fieldName] },
            {
                data: [
                    { collectionDate: '2025-01-01', count: 4 },
                    { collectionDate: '2025-02-01', count: 5 },
                ],
            },
        );

        const result = await getDateRange(DUMMY_LAPIS_URL, fieldName);

        expect(result).toEqual({ start: '2025-01-01', end: '2025-02-01' });
    });

    test('should throw when LAPIS request fails', async () => {
        const fieldName = 'collectionDate';

        lapisRouteMocker.mockPostAggregated({ fields: [fieldName], orderBy: [fieldName] }, { data: [] }, 500);

        await expect(getDateRange(DUMMY_LAPIS_URL, fieldName)).rejects.toThrow(/Failed to fetch date range/);
    });

    test('should throw when response has no data', async () => {
        const fieldName = 'collectionDate';

        lapisRouteMocker.mockPostAggregated({ fields: [fieldName], orderBy: [fieldName] }, { data: [] });

        await expect(getDateRange(DUMMY_LAPIS_URL, fieldName)).rejects.toThrow(/No data returned/);
    });

    test('should throw on unexpected response shape', async () => {
        const fieldName = 'collectionDate';

        lapisRouteMocker.mockPostAggregated(
            { fields: [fieldName], orderBy: [fieldName] },
            // @ts-expect-error intentionally wrong shape
            { invalid: 'response' },
        );

        await expect(getDateRange(DUMMY_LAPIS_URL, fieldName)).rejects.toThrow(/Failed to parse date range response/);
    });
});
