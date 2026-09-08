import { type DateRangeOption } from '@genspectrum/dashboard-components/util';
import dayjs from 'dayjs';

import { ALL_TIMES_LABEL } from './defaultDateRangeOption';

export function recentDaysLabel(days: number): string {
    return `Most recent ${days} days`;
}

export const RECENT_DAYS_OPTIONS = [7, 14, 30, 60, 90] as const;

// Index into RECENT_DAYS_OPTIONS above to use as the default sampling date window when no
// explicit samplingDate is given (see WasapPageStateHandler) - keeping it as an index instead
// of a separate day count keeps it from silently drifting out of sync with the options above.
export const DEFAULT_RECENT_DAYS_INDEX = 2;

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

    const recentDaysOptions = RECENT_DAYS_OPTIONS.map((days) => {
        const start = end.subtract(days - 1, 'day');
        return {
            label: recentDaysLabel(days),
            dateFrom: start.format('YYYY-MM-DD'),
            dateTo: end.format('YYYY-MM-DD'),
        };
    });

    return [...recentDaysOptions, { label: ALL_TIMES_LABEL, dateFrom: startDate }];
}
