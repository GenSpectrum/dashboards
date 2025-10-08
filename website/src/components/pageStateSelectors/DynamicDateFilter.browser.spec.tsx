import React from 'react';
import { describe, expect } from 'vitest';
import { render } from 'vitest-browser-react';

import { DynamicDateFilter } from './DynamicDateFilter.tsx';
import { DUMMY_LAPIS_URL, LapisRouteMocker } from '../../../routeMocker.ts';
import { it } from '../../../test-extend.ts';
import { recentDaysDateRangeOptions } from '../../util/recentDaysDateRangeOptions.ts';
import { withQueryProvider } from '../subscriptions/backendApi/withQueryProvider.tsx';

const WrappedDynamicDateFilter = withQueryProvider(DynamicDateFilter);

describe('DynamicDateFilter', () => {
    it('has multiple options', async ({ routeMockers: { lapis } }) => {
        setupLapisMocks(lapis);

        const { getByRole, getByText } = render(
            <gs-app lapis={DUMMY_LAPIS_URL}>
                <WrappedDynamicDateFilter
                    label='Sampling date'
                    lapis={DUMMY_LAPIS_URL}
                    dateFieldName='sampling_date'
                    generateOptions={recentDaysDateRangeOptions}
                    value={undefined}
                    onChange={() => {}}
                />
            </gs-app>,
        );

        await expect.element(getByText('Select an option')).toBeInTheDocument();

        const select = getByRole('combobox');
        const options = select.getByRole('option', { includeHidden: true }).elements();
        expect(options).toHaveLength(6); // 5 recent days options + 1 custom option
    });

    it('has recent days options with correct labels', async ({ routeMockers: { lapis } }) => {
        setupLapisMocks(lapis);

        const { getByRole, getByText } = render(
            <gs-app lapis={DUMMY_LAPIS_URL}>
                <WrappedDynamicDateFilter
                    label='Sampling date'
                    lapis={DUMMY_LAPIS_URL}
                    dateFieldName='sampling_date'
                    generateOptions={recentDaysDateRangeOptions}
                    value={undefined}
                    onChange={() => {}}
                />
            </gs-app>,
        );

        await expect.element(getByText('Select an option')).toBeInTheDocument();

        const select = getByRole('combobox');
        const options = select.getByRole('option', { includeHidden: true }).elements();
        const recentDaysOptions = options.filter((e) => {
            const value = e.getAttribute('value');
            return value?.startsWith('Most recent');
        });
        expect(recentDaysOptions).toHaveLength(5);
        const labels = recentDaysOptions.map((e) => e.getAttribute('value'));
        expect(labels).toContain('Most recent 7 days');
        expect(labels).toContain('Most recent 14 days');
        expect(labels).toContain('Most recent 30 days');
        expect(labels).toContain('Most recent 60 days');
        expect(labels).toContain('Most recent 90 days');
    });
});

function setupLapisMocks(lapisRouteMocker: LapisRouteMocker) {
    lapisRouteMocker.mockReferenceGenome({ nucleotideSequences: [{ name: 'main', sequence: 'ATGC' }], genes: [] });
    lapisRouteMocker.mockPostAggregated(
        { fields: ['sampling_date'], orderBy: ['sampling_date'] },
        {
            data: [
                /* eslint-disable @typescript-eslint/naming-convention */
                { count: 2251132, sampling_date: '2025-06-12' },
                { count: 4501244, sampling_date: '2025-06-16' },
                { count: 5928596, sampling_date: '2025-06-18' },
                { count: 1289822, sampling_date: '2025-06-21' },
                { count: 1942536, sampling_date: '2025-06-25' },
                { count: 2250146, sampling_date: '2025-06-27' },
                { count: 5932947, sampling_date: '2025-06-28' },
                { count: 6436524, sampling_date: '2025-06-30' },
                { count: 2250725, sampling_date: '2025-07-03' },
                { count: 6785938, sampling_date: '2025-07-06' },
                { count: 4500194, sampling_date: '2025-07-07' },
                { count: 11253745, sampling_date: '2025-07-11' },
                { count: 2250440, sampling_date: '2025-07-12' },
                /* eslint-enable @typescript-eslint/naming-convention */
            ],
        },
    );
}
