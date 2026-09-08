import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { describe, expect } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { useResolvedSamplingDate } from './useResolvedSamplingDate';
import type { WasapPageConfig } from './wasapPageConfig';
import { DUMMY_LAPIS_URL, type LapisRouteMocker } from '../../../../routeMocker.ts';
import { it } from '../../../../test-extend.ts';
import { recentDaysDateRangeOptions } from '../../../util/recentDaysDateRangeOptions';
import { defaultSamplingDateRange } from '../../../views/pageStateHandlers/WasapPageStateHandler';

const config = { lapisBaseUrl: DUMMY_LAPIS_URL, samplingDateField: 'sampling_date' } as WasapPageConfig;

function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = new QueryClient();
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function mockDateRange(lapisRouteMocker: LapisRouteMocker) {
    lapisRouteMocker.mockPostAggregated(
        { fields: ['sampling_date'], orderBy: ['sampling_date'] },
        {
            /* eslint-disable @typescript-eslint/naming-convention */
            data: [
                { count: 1, sampling_date: '2025-06-12' },
                { count: 1, sampling_date: '2025-07-12' },
            ],
            /* eslint-enable @typescript-eslint/naming-convention */
        },
    );
}

describe('useResolvedSamplingDate', () => {
    it('returns an already-resolved samplingDate immediately, without any network request', () => {
        const samplingDate = { label: 'Custom', dateFrom: '2024-01-01', dateTo: '2024-12-31' };

        const { result } = renderHook(() => useResolvedSamplingDate(config, samplingDate), { wrapper: Wrapper });

        expect(result.current.isPending).toBe(false);
        expect(result.current.samplingDate).toEqual(samplingDate);
    });

    it('resolves a preset label against the dataset date range', async ({ routeMockers: { lapis } }) => {
        mockDateRange(lapis);
        const samplingDate = { label: 'Most recent 14 days' };

        const { result } = renderHook(() => useResolvedSamplingDate(config, samplingDate), { wrapper: Wrapper });

        expect(result.current.isPending).toBe(true);

        await expect.poll(() => result.current.isPending).toBe(false);

        const expected = recentDaysDateRangeOptions({ startDate: '2025-06-12', endDate: '2025-07-12' }).find(
            (option) => option.label === 'Most recent 14 days',
        );
        expect(result.current.samplingDate).toEqual(expected);
    });

    it('falls back to the default window when the label does not match any known option', async ({
        routeMockers: { lapis },
    }) => {
        mockDateRange(lapis);
        const samplingDate = { label: 'Some stale preset that no longer exists' };

        const { result } = renderHook(() => useResolvedSamplingDate(config, samplingDate), { wrapper: Wrapper });

        await expect.poll(() => result.current.isPending).toBe(false);

        expect(result.current.samplingDate).toEqual(defaultSamplingDateRange());
    });
});
