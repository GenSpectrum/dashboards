import dayjs from 'dayjs';
import { describe, expect, test } from 'vitest';

import { getLastUpdatedDate } from './getLastUpdatedDate.ts';
import { DUMMY_LAPIS_URL } from '../../routeMocker.ts';
import { lapisRouteMocker } from '../../vitest.setup.ts';

describe('getLastUpdatedDate', () => {
    test('should return the dataVersion for today', async () => {
        const currentTimestamp = dayjs().unix();
        lapisRouteMocker.mockInfo({ dataVersion: currentTimestamp.toString() });

        const result = await getLastUpdatedDate(DUMMY_LAPIS_URL);

        expect(result).toContain('Today at');
    });

    test('should return the dataVersion for a date in the past', async () => {
        lapisRouteMocker.mockInfo({ dataVersion: '1531338688' });

        const result = await getLastUpdatedDate(DUMMY_LAPIS_URL);

        expect(result).equals('on 2018-07-11');
    });

    test('should return undefined when LAPIS request fails', async () => {
        lapisRouteMocker.mockInfo({ dataVersion: '' }, 500);

        const result = await getLastUpdatedDate(DUMMY_LAPIS_URL);

        expect(result).toBeNull();
    });

    test('should handle non-numeric data versions gracefully', async () => {
        lapisRouteMocker.mockInfo({ dataVersion: 'not a number' });

        const result = await getLastUpdatedDate(DUMMY_LAPIS_URL);

        expect(result).toBeNull();
    });
});
