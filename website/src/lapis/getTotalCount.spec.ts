import { beforeEach, describe, expect, test } from 'vitest';

import { getTotalCount } from './getTotalCount.ts';
import { astroApiMocks, DUMMY_LAPIS_URL, lapisRequestMocks } from '../../vitest.setup.ts';

describe('getTotalCount', () => {
    beforeEach(() => {
        astroApiMocks.log();
    });

    test('should return the total count', async () => {
        const lapisFilter = { country: 'Germany' };

        lapisRequestMocks.postAggregated(lapisFilter, { data: [{ count: 42 }] });

        const result = await getTotalCount(DUMMY_LAPIS_URL, lapisFilter);

        expect(result).equals(42);
    });

    test('should return undefined when LAPIS request fails', async () => {
        const lapisFilter = { country: 'Germany' };

        lapisRequestMocks.postAggregated(lapisFilter, { data: [{ count: 42 }] }, 500);

        await expect(getTotalCount(DUMMY_LAPIS_URL, lapisFilter)).rejects.toThrow(
            /Failed to fetch lapis aggregated data/,
        );
    });

    test('should return undefined when LAPIS returns unexpected data', async () => {
        const lapisFilter = { country: 'Germany' };

        // @ts-expect-error -- intentionally passing wrong data
        lapisRequestMocks.postAggregated(lapisFilter, { data: 'something unexpected' });

        await expect(getTotalCount(DUMMY_LAPIS_URL, lapisFilter)).rejects.toThrow(
            /Failed to parse lapis aggregated data/,
        );
    });
});
