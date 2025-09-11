import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

export function weeklyAndMonthlyDateRangeOptions(earliestDate: string) {
    const startDate = dayjs(earliestDate);
    const endDate = dayjs();

    return () => {
        const options: { label: string; dateFrom: string; dateTo: string }[] = [];

        // Weeks
        let current = startDate.startOf('week');
        while (current.isBefore(endDate)) {
            const weekStart = current.startOf('week');
            const weekEnd = current.endOf('week');
            options.push({
                label: `${current.year()}-W${String(current.isoWeek()).padStart(2, '0')}`,
                dateFrom: weekStart.format('YYYY-MM-DD'),
                dateTo: weekEnd.format('YYYY-MM-DD'),
            });
            current = current.add(1, 'week');
        }

        // Months
        current = startDate.startOf('month');
        while (current.isBefore(endDate)) {
            options.push({
                label: current.format('YYYY-MM'),
                dateFrom: current.startOf('month').format('YYYY-MM-DD'),
                dateTo: current.endOf('month').format('YYYY-MM-DD'),
            });
            current = current.add(1, 'month');
        }

        return options;
    };
}
