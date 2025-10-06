import { beforeEach, describe, expect, test } from 'vitest';

import { getTotalCount } from './getTotalCount.ts';
import { DUMMY_LAPIS_URL } from '../../routeMocker.ts';
import { astroApiRouteMocker, lapisRouteMocker } from '../../vitest.setup.ts';

describe('getTotalCount', () => {
    beforeEach(() => {
        astroApiRouteMocker.mockLog();
    });

    test('should return the total count', async () => {
        const lapisFilter = { country: 'Germany' };

        lapisRouteMocker.mockPostAggregated(lapisFilter, { data: [{ count: 42 }] });

        const result = await getTotalCount(DUMMY_LAPIS_URL, lapisFilter);

        expect(result).equals(42);
    });

    test('foo', async () => {
        const lapisFilterA = { country: 'Germany' };
        const lapisFilterB = { country: 'Sweden' };
        const lapisFilterC = { country: 'USA' };

        lapisRouteMocker.mockPostAggregated(lapisFilterA, { data: [{ count: 42 }] });
        lapisRouteMocker.mockPostAggregated(lapisFilterB, { data: [{ count: 43 }] });

        const resA = await getTotalCount(DUMMY_LAPIS_URL, lapisFilterA);
        const resB = await getTotalCount(DUMMY_LAPIS_URL, lapisFilterB);
        const resC = await getTotalCount(DUMMY_LAPIS_URL, lapisFilterC);

        expect(resA).equals(42);
        expect(resB).equals(43);
    });

    test('should return undefined when LAPIS request fails', async () => {
        const lapisFilter = { country: 'Germany' };

        lapisRouteMocker.mockPostAggregated(lapisFilter, { data: [{ count: 42 }] }, 500);

        await expect(getTotalCount(DUMMY_LAPIS_URL, lapisFilter)).rejects.toThrow(
            /Failed to fetch lapis aggregated data/,
        );
    });

    test('should return undefined when LAPIS returns unexpected data', async () => {
        const lapisFilter = { country: 'Germany' };

        // @ts-expect-error -- intentionally passing wrong data
        lapisRouteMocker.mockPostAggregated(lapisFilter, { data: 'something unexpected' });

        await expect(getTotalCount(DUMMY_LAPIS_URL, lapisFilter)).rejects.toThrow(
            /Failed to parse lapis aggregated data/,
        );
    });
});
