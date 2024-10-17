import type { DateRangeOption } from '@genspectrum/dashboard-components';

export const chooseGranularityBasedOnDateRange = (
    dateRange: DateRangeOption,
    earliestDate: Date,
): 'day' | 'week' | 'month' | 'year' => {
    const dateFrom = dateRange.dateFrom !== undefined ? new Date(dateRange.dateFrom) : earliestDate;
    const dateTo = dateRange.dateTo !== undefined ? new Date(dateRange.dateTo) : new Date();

    const daysBetween = (dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24);
    if (daysBetween > 365 * 5) {
        return 'year';
    }
    if (daysBetween > 365 * 2) {
        return 'month';
    }
    if (daysBetween > 90) {
        return 'week';
    }
    return 'day';
};
