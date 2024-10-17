import type { DateRangeOption } from '@genspectrum/dashboard-components';
import { useEffect, useRef } from 'react';

import { CustomDateRangeLabel } from '../../types/DateWindow.ts';

// eslint-disable-next-line import/order,no-duplicate-imports -- make the component available
import '@genspectrum/dashboard-components';

export function GsDateRangeSelector({
    onDateRangeChange = () => {},
    initialValue,
    dateRangeOptions,
    earliestDate,
    dateColumn,
    width,
}: {
    dateColumn: string;
    onDateRangeChange?: (dateRange: DateRangeOption) => void;
    initialValue?: DateRangeOption;
    dateRangeOptions?: DateRangeOption[];
    earliestDate?: string;
    width?: string;
}) {
    const dateRangeSelectorRef = useRef<HTMLElement>();

    useEffect(() => {
        const getDateRange = (dateFrom: string, dateTo: string) => {
            return dateRangeOptions?.find((option) => option.dateFrom === dateFrom && option.dateTo === dateTo);
        };

        const handleDateRangeChange = (event: CustomEvent) => {
            const dateRange = event.detail;

            const dateFrom = dateRange[`${dateColumn}From`] as string;
            const dateTo = dateRange[`${dateColumn}To`] as string;

            const selectedDateRange = getDateRange(dateFrom, dateTo);
            if (selectedDateRange) {
                onDateRangeChange(selectedDateRange);
            } else {
                onDateRangeChange({ label: CustomDateRangeLabel, dateFrom, dateTo });
            }
        };

        const currentDateRangeSelectorRef = dateRangeSelectorRef.current;
        if (currentDateRangeSelectorRef) {
            currentDateRangeSelectorRef.addEventListener('gs-date-range-changed', handleDateRangeChange);
        }

        return () => {
            if (currentDateRangeSelectorRef) {
                currentDateRangeSelectorRef.removeEventListener('gs-date-range-changed', handleDateRangeChange);
            }
        };
    }, [dateRangeOptions, dateColumn, onDateRangeChange, dateRangeSelectorRef]);

    const isCustom = initialValue?.label === CustomDateRangeLabel;

    return (
        <gs-date-range-selector
            ref={dateRangeSelectorRef}
            dateRangeOptions={JSON.stringify(dateRangeOptions)}
            earliestDate={earliestDate}
            initialValue={isCustom ? undefined : initialValue?.label}
            initialDateFrom={isCustom ? initialValue.dateFrom : undefined}
            initialDateTo={isCustom ? initialValue.dateTo : undefined}
            dateColumn={dateColumn}
            width={width}
        ></gs-date-range-selector>
    );
}
