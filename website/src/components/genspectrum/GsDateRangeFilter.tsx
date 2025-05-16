import '@genspectrum/dashboard-components/components';
import {
    type DateRangeOption,
    type DateRangeOptionChangedEvent,
    gsEventNames,
    type LapisFilter,
} from '@genspectrum/dashboard-components/util';
import { useEffect, useRef } from 'react';

import { CustomDateRangeLabel } from '../../types/DateWindow.ts';

export function GsDateRangeFilter({
    lapisDateField,
    onDateRangeChange = () => {},
    onLapisFilterChange = () => {},
    value,
    dateRangeOptions,
    earliestDate,
    width,
}: {
    lapisDateField: string;
    onDateRangeChange?: (dateRange: DateRangeOption | null) => void;
    onLapisFilterChange?: (lapisFilter: LapisFilter) => void;
    value?: DateRangeOption | null;
    dateRangeOptions?: DateRangeOption[];
    earliestDate?: string;
    width?: string;
}) {
    const dateRangeSelectorRef = useRef<HTMLElement>();

    useEffect(() => {
        const currentDateRangeSelectorRef = dateRangeSelectorRef.current;
        if (!currentDateRangeSelectorRef) {
            return;
        }

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

        const handleLapisFilterChanged = (event: CustomEvent<Record<string, string>>) => {
            onLapisFilterChange(event.detail);
        };

        currentDateRangeSelectorRef.addEventListener(gsEventNames.dateRangeOptionChanged, handleDateRangeOptionChange);
        currentDateRangeSelectorRef.addEventListener(gsEventNames.dateRangeFilterChanged, handleLapisFilterChanged);

        return () => {
            currentDateRangeSelectorRef.removeEventListener(
                gsEventNames.dateRangeOptionChanged,
                handleDateRangeOptionChange,
            );
            currentDateRangeSelectorRef.removeEventListener(
                gsEventNames.dateRangeFilterChanged,
                handleLapisFilterChanged,
            );
        };
    }, [dateRangeOptions, lapisDateField, onDateRangeChange, dateRangeSelectorRef, onLapisFilterChange]);

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
