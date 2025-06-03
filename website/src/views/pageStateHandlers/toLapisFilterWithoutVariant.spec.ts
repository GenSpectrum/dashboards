import { describe, expect, it } from 'vitest';

import type { DatasetFilter } from '../View.ts';
import { toLapisFilterWithoutVariant } from './toLapisFilterWithoutVariant.ts';

describe('toLapisFilterWithoutVariant', () => {
    const emptyFilter: DatasetFilter = {
        locationFilters: {},
        textFilters: {},
        dateFilters: {},
        numberFilters: {},
    };

    const additionalFilters = {
        someAdditionalFilter: 'someAdditionalFilterValue',
    };

    it('should convert empty page state to empty lapis filter', () => {
        const result = toLapisFilterWithoutVariant(emptyFilter, {});

        expect(result).toStrictEqual({});
    });

    it('should append additionalFilters to lapis filter', () => {
        const result = toLapisFilterWithoutVariant(emptyFilter, additionalFilters);

        expect(result).toStrictEqual(additionalFilters);
    });

    it('should convert page state to lapis filter', () => {
        const filter: DatasetFilter = {
            locationFilters: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'country,region': { country: 'SomeCountry' },
            },
            dateFilters: {
                date: { label: 'Last 7 Days', dateFrom: '2024-11-22', dateTo: '2024-11-29' },
            },
            textFilters: {
                someTextFilter: 'someTextFilterValue',
            },
            numberFilters: {
                someLapisNumberField: {
                    min: 0,
                    max: 234,
                },
            },
            advancedQuery: '123T & 345G',
        };

        const result = toLapisFilterWithoutVariant(filter, additionalFilters);

        expect(result).toStrictEqual({
            country: 'SomeCountry',
            dateFrom: '2024-11-22',
            dateTo: '2024-11-29',
            someTextFilter: 'someTextFilterValue',
            someLapisNumberFieldFrom: 0,
            someLapisNumberFieldTo: 234,
            someAdditionalFilter: 'someAdditionalFilterValue',
            advancedQuery: '123T & 345G',
        });
    });

    it('should convert page state with partial from/to filters to lapis filter', () => {
        const filter: DatasetFilter = {
            locationFilters: {},
            dateFilters: {
                date: { label: 'SomeLabel', dateFrom: '2024-11-22' },
            },
            textFilters: {},
            numberFilters: {
                someLapisNumberField: {
                    min: 123,
                },
            },
        };

        const result = toLapisFilterWithoutVariant(filter, additionalFilters);

        expect(result).toStrictEqual({
            dateFrom: '2024-11-22',
            someLapisNumberFieldFrom: 123,
            someAdditionalFilter: 'someAdditionalFilterValue',
        });
    });
});
