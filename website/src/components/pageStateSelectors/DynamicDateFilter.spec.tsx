import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, test } from 'vitest';

import { DynamicWeekMonthDateFilter } from './DynamicDateFilter.tsx';
import { DUMMY_LAPIS_URL, lapisRequestMocks } from '../../../vitest.setup.ts';
import { wasapDateRangeOptions } from '../../views/pageStateHandlers/WasapPageStateHandler.ts';

describe('DynamicWeekMonthDateFilter', () => {
    test('TODO', async () => {
        lapisRequestMocks.referenceGenome({ nucleotideSequences: [{ name: 'main', sequence: 'ATGC' }], genes: [] });
        lapisRequestMocks.postAggregated({}, { data: [] });
        lapisRequestMocks.postAggregated(
            {fields: ['sampling_date'], orderBy: ['sampling_date']},
            { data: [
                /* eslint-disable @typescript-eslint/naming-convention */
                { count: 2251132, sampling_date: "2025-06-12" },
                { count: 4501244, sampling_date: "2025-06-16" },
                { count: 5928596, sampling_date: "2025-06-18" },
                { count: 1289822, sampling_date: "2025-06-21" },
                { count: 1942536, sampling_date: "2025-06-25" },
                { count: 2250146, sampling_date: "2025-06-27" },
                { count: 5932947, sampling_date: "2025-06-28" },
                { count: 6436524, sampling_date: "2025-06-30" },
                { count: 2250725, sampling_date: "2025-07-03" },
                { count: 6785938, sampling_date: "2025-07-06" },
                { count: 4500194, sampling_date: "2025-07-07" },
                { count: 11253745, sampling_date: "2025-07-11" },
                { count: 2250440, sampling_date: "2025-07-12" },
                /* eslint-enable @typescript-eslint/naming-convention */
            ] });

        const baselineOptions = wasapDateRangeOptions();

        const { findByText, findByRole, getAllByRole } = render(
            <gs-app lapis={DUMMY_LAPIS_URL}>
                <DynamicWeekMonthDateFilter
                    lapis={DUMMY_LAPIS_URL}
                    dateFieldName='sampling_date'
                    baselineOptions={baselineOptions}
                    value={undefined}
                    onChange={() => {}}
                />
            </gs-app>,
        );

        // TODO - testing ... I can't seem to get the elements inside the custom element.
        // Not sure how to proceed.
        
        /*
        const select = await findByText('Select an option');

        expect(select).toBeInTheDocument();

        const options = getAllByRole('option');
        expect(options).toHaveLength(7);
        expect(options[0]).toHaveTextContent('First option');
        */
    });
});
