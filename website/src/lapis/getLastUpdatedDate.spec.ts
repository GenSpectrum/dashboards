import dayjs from 'dayjs';
import { describe, expect, test } from 'vitest';

import { getLastUpdatedDate } from './getLastUpdatedDate.ts';
import { DUMMY_LAPIS_URL, lapisRequestMocks } from '../../vitest.setup.ts';

describe('getLastUpdatedDate', () => {
    test('should return the dataVersion for today', async () => {
        const currentTimestamp = dayjs().unix();
        lapisRequestMocks.info({ dataVersion: currentTimestamp.toString() });

        const result = await getLastUpdatedDate(DUMMY_LAPIS_URL);

        expect(result).toContain('Today at');
    });

    test('should return the dataVersion for a date in the past', async () => {
        lapisRequestMocks.info({ dataVersion: '1531338688' });

        const result = await getLastUpdatedDate(DUMMY_LAPIS_URL);

        expect(result).equals('on 2018-07-11');
    });

    test('should return undefined when LAPIS request fails', async () => {
        lapisRequestMocks.info({ dataVersion: '' }, 500);

        const result = await getLastUpdatedDate(DUMMY_LAPIS_URL);

        expect(result).toBeUndefined();
    });

    test('should handle non-numeric data versions gracefully', async () => {
        lapisRequestMocks.info({ dataVersion: 'not a number' });

        const result = await getLastUpdatedDate(DUMMY_LAPIS_URL);

        expect(result).toBeUndefined();
    });
});
