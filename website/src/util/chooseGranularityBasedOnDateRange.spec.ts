import type { DateRangeOption } from '@genspectrum/dashboard-components';
import { describe, expect, it } from 'vitest';

import { chooseGranularityBasedOnDateRange } from './chooseGranularityBasedOnDateRange.ts';

describe('chooseGranularityBasedOnDateRange', () => {
    const earliestDate = new Date('2000-01-01');

    it('should return "year" for date ranges over 5 years', () => {
        const dateRange: DateRangeOption = { label: 'SomeLabel', dateFrom: '2010-01-01', dateTo: '2020-01-01' };

        expect(chooseGranularityBasedOnDateRange(dateRange, earliestDate)).toBe('year');
    });

    it('should return "month" for date ranges over 2 years but less than or equal to 5 years', () => {
        const dateRange: DateRangeOption = { label: 'SomeLabel', dateFrom: '2017-01-01', dateTo: '2020-01-01' };

        expect(chooseGranularityBasedOnDateRange(dateRange, earliestDate)).toBe('month');
    });

    it('should return "week" for date ranges over 90 days but less than or equal to 2 years', () => {
        const dateRange: DateRangeOption = { label: 'SomeLabel', dateFrom: '2023-01-01', dateTo: '2023-06-01' };

        expect(chooseGranularityBasedOnDateRange(dateRange, earliestDate)).toBe('week');
    });

    it('should return "day" for date ranges less than or equal to 90 days', () => {
        const dateRange: DateRangeOption = { label: 'SomeLabel', dateFrom: '2023-10-01', dateTo: '2023-11-01' };

        expect(chooseGranularityBasedOnDateRange(dateRange, earliestDate)).toBe('day');
    });

    it('should use earliestDate when dateFrom is undefined', () => {
        const dateRange: DateRangeOption = { label: 'SomeLabel', dateTo: '2023-01-01' };
        const earliestDate = new Date('2020-01-01');

        expect(chooseGranularityBasedOnDateRange(dateRange, earliestDate)).toBe('month');
    });

    it('should use current date when dateTo is undefined', () => {
        const dateRange: DateRangeOption = { label: 'SomeLabel', dateFrom: '2000-01-01' };

        expect(chooseGranularityBasedOnDateRange(dateRange, earliestDate)).toBe('year');
    });
});
