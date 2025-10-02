import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

import { weeklyAndMonthlyDateRangeOptions } from './weeklyAndMonthlyDateRangeOption';

describe('weeklyAndMonthlyDateRangeOptions', () => {
    const fixedNow = '2025-09-15';

    beforeAll(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(fixedNow));
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    it('should set 2025-09-15 into week 38 with correct week start and end', () => {
        const options = weeklyAndMonthlyDateRangeOptions('2025-09-15');

        const weekLabels = options.filter((o) => o.label.includes('W')).map((o) => o.label);
        expect(weekLabels).toContain('2025-W38');
        expect(options[0].dateFrom).toBe('2025-09-15');
        expect(options[0].dateTo).toBe('2025-09-21');
    });

    it('should include week with partial overlap', () => {
        const options = weeklyAndMonthlyDateRangeOptions('2025-09-07');

        const weekLabels = options.filter((o) => o.label.includes('W')).map((o) => o.label);
        expect(weekLabels).toContain('2025-W36');
        expect(weekLabels).toContain('2025-W37');
        expect(weekLabels).toContain('2025-W38');
    });

    it('should set 2025-09-15 into correct month with correct month start and end', () => {
        const options = weeklyAndMonthlyDateRangeOptions('2025-09-15');

        const monthLabels = options.filter((o) => /^\d{4}-\d{2}$/.test(o.label)).map((o) => o.label);
        expect(monthLabels).toContain('2025-09');
        const septemberLabel = options.find((o) => o.label === '2025-09');
        expect(septemberLabel).not.toBeUndefined();
        expect(septemberLabel?.dateFrom).toBe('2025-09-01');
        expect(septemberLabel?.dateTo).toBe('2025-09-30');
    });

    it('should generate monthly ranges from earliestDate to now', () => {
        const options = weeklyAndMonthlyDateRangeOptions('2025-07-01');

        const monthLabels = options.filter((o) => /^\d{4}-\d{2}$/.test(o.label)).map((o) => o.label);
        expect(monthLabels).toContain('2025-07');
        expect(monthLabels).toContain('2025-08');
        expect(monthLabels).toContain('2025-09');
    });

    it('should return empty when earliestDate is after current date', () => {
        const options = weeklyAndMonthlyDateRangeOptions('2026-01-01');
        expect(options).toEqual([]);
    });
});
