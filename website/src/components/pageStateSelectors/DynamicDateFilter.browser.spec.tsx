import React from 'react';
import { describe, expect } from 'vitest';
import { render } from 'vitest-browser-react';

import { DynamicDateFilter } from './DynamicDateFilter.tsx';
import { DUMMY_LAPIS_URL, LapisRouteMocker } from '../../../routeMocker.ts';
import { it } from '../../../test-extend.ts';
import { weeklyAndMonthlyDateRangeOptions } from '../../util/weeklyAndMonthlyDateRangeOption.ts';
import { withQueryProvider } from '../subscriptions/backendApi/withQueryProvider.tsx';

const baselineOptions = weeklyAndMonthlyDateRangeOptions('2025-03-01');

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
                    baselineOptions={baselineOptions}
                    value={undefined}
                    onChange={() => {}}
                />
            </gs-app>,
        );

        await expect.element(getByText('Select an option')).toBeInTheDocument();

        const select = getByRole('combobox');
        const options = select.getByRole('option', { includeHidden: true }).elements();
        expect(options).toHaveLength(8);
    });

    it('has monthly options that all overlap with the data date range', async ({ routeMockers: { lapis } }) => {
        setupLapisMocks(lapis);

        const { getByRole, getByText } = render(
            <gs-app lapis={DUMMY_LAPIS_URL}>
                <WrappedDynamicDateFilter
                    label='Sampling date'
                    lapis={DUMMY_LAPIS_URL}
                    dateFieldName='sampling_date'
                    baselineOptions={baselineOptions}
                    value={undefined}
                    onChange={() => {}}
                />
            </gs-app>,
        );

        await expect.element(getByText('Select an option')).toBeInTheDocument();

        const select = getByRole('combobox');
        const options = select.getByRole('option', { includeHidden: true }).elements();
        const monthOptions = options.filter((e) => {
            const value = e.getAttribute('value');
            return value !== null && /^2025-\d\d$/.test(value);
        });
        expect(monthOptions).toHaveLength(2);
        const monthOptionsValues = monthOptions.map((e) => e.getAttribute('value'));
        expect(monthOptionsValues).toContain('2025-06');
        expect(monthOptionsValues).toContain('2025-07');
    });

    it('has weekly options that all overlap with the data date range', async ({ routeMockers: { lapis } }) => {
        setupLapisMocks(lapis);

        const { getByRole, getByText } = render(
            <gs-app lapis={DUMMY_LAPIS_URL}>
                <WrappedDynamicDateFilter
                    label='Sampling date'
                    lapis={DUMMY_LAPIS_URL}
                    dateFieldName='sampling_date'
                    baselineOptions={baselineOptions}
                    value={undefined}
                    onChange={() => {}}
                />
            </gs-app>,
        );

        await expect.element(getByText('Select an option')).toBeInTheDocument();

        const select = getByRole('combobox');
        const options = select.getByRole('option', { includeHidden: true }).elements();
        const weekOptions = options.filter((e) => {
            const value = e.getAttribute('value');
            return value !== null && /^2025-W\d\d$/.test(value);
        });
        expect(weekOptions).toHaveLength(5);
        const weekOptionsValues = weekOptions.map((e) => e.getAttribute('value'));
        expect(weekOptionsValues).toEqual(['2025-W24', '2025-W25', '2025-W26', '2025-W27', '2025-W28']);
    });

    it('has only a single week and single month option for single data date', async ({ routeMockers }) => {
        routeMockers.lapis.mockReferenceGenome({
            nucleotideSequences: [{ name: 'main', sequence: 'ATGC' }],
            genes: [],
        });
        routeMockers.lapis.mockPostAggregated(
            { fields: ['sampling_date'], orderBy: ['sampling_date'] },
            {
                data: [
                    /* eslint-disable @typescript-eslint/naming-convention */
                    { count: 1, sampling_date: '2025-05-01' },
                    /* eslint-enable @typescript-eslint/naming-convention */
                ],
            },
        );

        const { getByRole, getByText } = render(
            <gs-app lapis={DUMMY_LAPIS_URL}>
                <WrappedDynamicDateFilter
                    label='Sampling date'
                    lapis={DUMMY_LAPIS_URL}
                    dateFieldName='sampling_date'
                    baselineOptions={baselineOptions}
                    value={undefined}
                    onChange={() => {}}
                />
            </gs-app>,
        );

        await expect.element(getByText('Select an option')).toBeInTheDocument();

        const select = getByRole('combobox');
        const options = select.getByRole('option', { includeHidden: true }).elements();
        expect(options).toHaveLength(3);
        const optionsValues = options.map((e) => e.getAttribute('value'));
        expect(optionsValues).toEqual(['__undefined__', '2025-W18', '2025-05']);
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
