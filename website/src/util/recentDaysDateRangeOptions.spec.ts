import { describe, it, expect } from 'vitest';

import { recentDaysDateRangeOptions } from './recentDaysDateRangeOptions';

describe('recentDaysDateRangeOptions', () => {
    it('should generate options for 7, 14, 30, 60, and 90 days', () => {
        const endDate = '2025-03-08';
        const options = recentDaysDateRangeOptions('2025-01-01', endDate);

        expect(options).toHaveLength(5);
        expect(options[0].label).toBe('Most recent 7 days');
        expect(options[1].label).toBe('Most recent 14 days');
        expect(options[2].label).toBe('Most recent 30 days');
        expect(options[3].label).toBe('Most recent 60 days');
        expect(options[4].label).toBe('Most recent 90 days');
    });

    it('should calculate correct date ranges counting backwards from end date', () => {
        const endDate = '2025-03-08';
        const options = recentDaysDateRangeOptions('2025-01-01', endDate);

        // 7 days: 2025-03-02 to 2025-03-08
        expect(options[0].dateFrom).toBe('2025-03-02');
        expect(options[0].dateTo).toBe('2025-03-08');

        // 14 days: 2025-02-23 to 2025-03-08
        expect(options[1].dateFrom).toBe('2025-02-23');
        expect(options[1].dateTo).toBe('2025-03-08');

        // 30 days: 2025-02-07 to 2025-03-08
        expect(options[2].dateFrom).toBe('2025-02-07');
        expect(options[2].dateTo).toBe('2025-03-08');

        // 60 days: 2025-01-08 to 2025-03-08
        expect(options[3].dateFrom).toBe('2025-01-08');
        expect(options[3].dateTo).toBe('2025-03-08');

        // 90 days: 2024-12-09 to 2025-03-08
        expect(options[4].dateFrom).toBe('2024-12-09');
        expect(options[4].dateTo).toBe('2025-03-08');
    });

    it('should work with different end dates', () => {
        const endDate = '2025-12-31';
        const options = recentDaysDateRangeOptions('2025-01-01', endDate);

        expect(options[0].dateTo).toBe('2025-12-31');
        expect(options[0].dateFrom).toBe('2025-12-25'); // 7 days before Dec 31

        expect(options[2].dateTo).toBe('2025-12-31');
        expect(options[2].dateFrom).toBe('2025-12-02'); // 30 days before Dec 31
    });

    it('should handle leap years correctly', () => {
        const endDate = '2024-03-01'; // 2024 is a leap year
        const options = recentDaysDateRangeOptions('2024-01-01', endDate);

        // 30 days back from March 1, 2024 should be February 1, 2024 (accounting for Feb 29)
        expect(options[2].dateFrom).toBe('2024-02-01');
        expect(options[2].dateTo).toBe('2024-03-01');
    });

    it('should work across year boundaries', () => {
        const endDate = '2025-01-15';
        const options = recentDaysDateRangeOptions('2024-01-01', endDate);

        // 7 days: 2025-01-09 to 2025-01-15
        expect(options[0].dateFrom).toBe('2025-01-09');
        expect(options[0].dateTo).toBe('2025-01-15');

        // 30 days: 2024-12-17 to 2025-01-15 (crosses into previous year)
        expect(options[2].dateFrom).toBe('2024-12-17');
        expect(options[2].dateTo).toBe('2025-01-15');

        // 90 days: 2024-10-18 to 2025-01-15 (spans multiple months and year boundary)
        expect(options[4].dateFrom).toBe('2024-10-18');
        expect(options[4].dateTo).toBe('2025-01-15');
    });
});
