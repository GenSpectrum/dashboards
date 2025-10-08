import { type DateRangeOption } from '@genspectrum/dashboard-components/util';
import dayjs from 'dayjs';

/**
 * Generates date range options for "most recent X days" where X is 7, 14, 30, 60, or 90.
 * Counts backwards from the given end date.
 */
export function recentDaysDateRangeOptions(_startDate: string, endDate: string): DateRangeOption[] {
    const end = dayjs(endDate);
    const dayOptions = [7, 14, 30, 60, 90];

    return dayOptions.map((days) => {
        const start = end.subtract(days - 1, 'day');
        return {
            label: `Most recent ${days} days`,
            dateFrom: start.format('YYYY-MM-DD'),
            dateTo: end.format('YYYY-MM-DD'),
        };
    });
}
