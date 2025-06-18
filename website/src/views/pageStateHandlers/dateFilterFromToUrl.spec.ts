import { describe, expect, it } from 'vitest';

import { parseDateRangesFromUrl, setSearchFromDateFilters } from './dateFilterFromToUrl.ts';
import type { BaselineFilterConfig } from '../../components/pageStateSelectors/BaselineSelector.tsx';
import { CustomDateRangeLabel } from '../../types/DateWindow.ts';
import type { Dataset } from '../View.ts';

const mockDateRangeOption = { label: 'Last 7 Days', dateFrom: '2024-11-22', dateTo: '2024-11-29' };

const dateConfigs = [
    {
        type: 'date',
        dateColumn: 'someDateField',
        dateRangeOptions: () => [mockDateRangeOption],
        earliestDate: '1999-01-01',
    },
    {
        type: 'date',
        dateColumn: 'someOtherDateField',
        dateRangeOptions: () => [mockDateRangeOption],
        earliestDate: '1999-01-01',
    },
    {
        type: 'text',
        lapisField: 'uninvolvedField',
    },
] satisfies BaselineFilterConfig[];

describe('parseDateRangesFromUrl', () => {
    it('should parse url to date range filter predefined option', () => {
        const search = new Map<string, string>([
            ['someDateField', 'Last 7 Days'],
            ['notADateFilter', 'notADateFilter'],
        ]);

        const result = parseDateRangesFromUrl(search, dateConfigs);

        expect(result).toStrictEqual({ someDateField: mockDateRangeOption });
    });

    it('should ignore invalid date range option', () => {
        const search = new Map<string, string>([['someDateField', 'invalidOption']]);

        const result = parseDateRangesFromUrl(search, dateConfigs);

        expect(result).toStrictEqual({});
    });

    it('should parse a date range', () => {
        const search = new Map<string, string>([['someDateField', '2020-01-01--2020-01-31']]);

        const result = parseDateRangesFromUrl(search, dateConfigs);

        expect(result).toStrictEqual({
            someDateField: {
                dateFrom: '2020-01-01',
                dateTo: '2020-01-31',
                label: CustomDateRangeLabel,
            },
        });
    });

    it('should parse a date range with missing date to', () => {
        const search = new Map<string, string>([['someDateField', '2020-01-01--']]);

        const result = parseDateRangesFromUrl(search, dateConfigs);

        expect(result).toStrictEqual({
            someDateField: {
                dateFrom: '2020-01-01',
                dateTo: undefined,
                label: CustomDateRangeLabel,
            },
        });
    });

    it('should parse a date range with missing date from', () => {
        const search = new Map<string, string>([['someDateField', '--2020-01-31']]);

        const result = parseDateRangesFromUrl(search, dateConfigs);

        expect(result).toStrictEqual({
            someDateField: {
                dateFrom: undefined,
                dateTo: '2020-01-31',
                label: CustomDateRangeLabel,
            },
        });
    });
});

describe('setSearchFromDateFilters', () => {
    it('should set search from date filter', () => {
        const search = new URLSearchParams();
        const pageState = {
            datasetFilter: {
                locationFilters: {},
                textFilters: {},
                dateFilters: {
                    someDateField: mockDateRangeOption,
                },
                numberFilters: {},
            },
        } satisfies Dataset;

        setSearchFromDateFilters(search, pageState, dateConfigs);

        expect(search.get('someDateField')).toStrictEqual('Last 7 Days');
        expect(search.get('someOtherDateField')).toStrictEqual(null);
    });

    it('should handle missing date filter value', () => {
        const search = new URLSearchParams();
        const pageState = {
            datasetFilter: {
                locationFilters: {},
                textFilters: {},
                dateFilters: {},
                numberFilters: {},
            },
        } satisfies Dataset;

        setSearchFromDateFilters(search, pageState, dateConfigs);

        expect(search.get('someDateField')).toStrictEqual(null);
        expect(search.get('someOtherDateField')).toStrictEqual(null);
    });

    it('should ignore date filters that are null when setting search', () => {
        const search = new URLSearchParams();
        const pageState = {
            datasetFilter: {
                locationFilters: {},
                textFilters: {},
                dateFilters: {
                    someDateField: null,
                },
                numberFilters: {},
            },
        } satisfies Dataset;

        setSearchFromDateFilters(search, pageState, dateConfigs);

        expect(search.get('someDateField')).toStrictEqual(null);
        expect(search.get('someOtherDateField')).toStrictEqual(null);
    });

    it('should get input after a round trip over the url params', () => {
        const search = new URLSearchParams();
        const pageState = {
            datasetFilter: {
                locationFilters: {},
                textFilters: {},
                dateFilters: {
                    someDateField: mockDateRangeOption,
                },
                numberFilters: {},
            },
        } satisfies Dataset;

        setSearchFromDateFilters(search, pageState, dateConfigs);

        const result = parseDateRangesFromUrl(search, dateConfigs);

        expect(result).toStrictEqual({ someDateField: mockDateRangeOption });
    });
});
