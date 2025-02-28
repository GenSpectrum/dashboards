import { describe, expect, test } from 'vitest';

import { getTotalCount } from './getTotalCount.ts';
import { DUMMY_LAPIS_URL, lapisRequestMocks } from '../../vitest.setup.ts';

describe('getTotalCount', () => {
    test('should return the total count', async () => {
        const lapisFilter = { country: 'Germany' };

        lapisRequestMocks.postAggregated(lapisFilter, { data: [{ count: 42 }] });

        const result = await getTotalCount(DUMMY_LAPIS_URL, lapisFilter);

        expect(result).equals(42);
    });

    test('should return undefined when LAPIS request fails', async () => {
        const lapisFilter = { country: 'Germany' };

        lapisRequestMocks.postAggregated(lapisFilter, { data: [{ count: 42 }] }, 500);

        const result = await getTotalCount(DUMMY_LAPIS_URL, lapisFilter);

        expect(result).toBeUndefined();
    });

    test('should return undefined when LAPIS returns unexpected data', async () => {
        const lapisFilter = { country: 'Germany' };

        // @ts-expect-error -- intentionally passing wrong data
        lapisRequestMocks.postAggregated(lapisFilter, { data: 'something unexpected' });

        const result = await getTotalCount(DUMMY_LAPIS_URL, lapisFilter);

        expect(result).toBeUndefined();
    });
});
