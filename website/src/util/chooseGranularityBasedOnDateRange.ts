import type { DateRangeOption } from '@genspectrum/dashboard-components/util';

export const chooseGranularityBasedOnDateRange = ({
    earliestDate,
    dateRange,
}: {
    earliestDate: Date;
    dateRange?: DateRangeOption;
}): 'day' | 'week' | 'month' | 'year' => {
    if (dateRange === undefined) {
        return 'year';
    }

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
