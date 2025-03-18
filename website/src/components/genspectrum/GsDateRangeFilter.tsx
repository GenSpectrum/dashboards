import '@genspectrum/dashboard-components/components';
import { type DateRangeOption, type DateRangeOptionChangedEvent } from '@genspectrum/dashboard-components/util';
import { useEffect, useRef } from 'react';

import { CustomDateRangeLabel } from '../../types/DateWindow.ts';

export function GsDateRangeFilter({
    onDateRangeChange = () => {},
    value,
    dateRangeOptions,
    earliestDate,
    lapisDateField,
    width,
}: {
    lapisDateField: string;
    onDateRangeChange?: (dateRange: DateRangeOption | null) => void;
    value?: DateRangeOption | null;
    dateRangeOptions?: DateRangeOption[];
    earliestDate?: string;
    width?: string;
}) {
    const dateRangeSelectorRef = useRef<HTMLElement>();

    useEffect(() => {
        const handleDateRangeOptionChange = (event: DateRangeOptionChangedEvent) => {
            const dateRange = event.detail;

            if (dateRange === null) {
                onDateRangeChange(null);
            } else if (typeof dateRange === 'string') {
                const dateRangeOption = dateRangeOptions?.find((option) => option.label === dateRange);
                if (dateRangeOption !== undefined) {
                    onDateRangeChange(dateRangeOption);
                } else {
                    throw new Error(`Invalid date range option: ${dateRange}`);
                }
            } else {
                onDateRangeChange({ label: CustomDateRangeLabel, ...dateRange });
            }
        };

        const currentDateRangeSelectorRef = dateRangeSelectorRef.current;
        if (currentDateRangeSelectorRef) {
            currentDateRangeSelectorRef.addEventListener('gs-date-range-option-changed', handleDateRangeOptionChange);
        }

        return () => {
            if (currentDateRangeSelectorRef) {
                currentDateRangeSelectorRef.removeEventListener(
                    'gs-date-range-option-changed',
                    handleDateRangeOptionChange,
                );
            }
        };
    }, [dateRangeOptions, lapisDateField, onDateRangeChange, dateRangeSelectorRef]);

    const isCustom = value?.label === CustomDateRangeLabel;

    return (
        <gs-date-range-filter
            ref={dateRangeSelectorRef}
            dateRangeOptions={JSON.stringify(dateRangeOptions)}
            earliestDate={earliestDate}
            value={JSON.stringify(isCustom ? value : value?.label)}
            lapisDateField={lapisDateField}
            width={width}
        ></gs-date-range-filter>
    );
}
