import { type DateRangeOption } from '@genspectrum/dashboard-components/util';
import dayjs from 'dayjs';

import { ALL_TIMES_LABEL } from './defaultDateRangeOption';

export function recentDaysLabel(days: number): string {
    return `Most recent ${days} days`;
}

/**
 * Generates date range options for "most recent X days" where X is 7, 14, 30, 60, or 90,
 * counting backwards from the given end date, plus an "All times" option bounded by the
 * given start date (the earliest date actually present in the dataset).
 */
export function recentDaysDateRangeOptions({
    startDate,
    endDate,
}: {
    startDate: string;
    endDate: string;
}): DateRangeOption[] {
    const end = dayjs(endDate);
    const dayOptions = [7, 14, 30, 60, 90];

    const recentDaysOptions = dayOptions.map((days) => {
        const start = end.subtract(days - 1, 'day');
        return {
            label: recentDaysLabel(days),
            dateFrom: start.format('YYYY-MM-DD'),
            dateTo: end.format('YYYY-MM-DD'),
        };
    });

    return [...recentDaysOptions, { label: ALL_TIMES_LABEL, dateFrom: startDate }];
}
