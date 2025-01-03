import type { DateRangeOption, LapisFilter } from '@genspectrum/dashboard-components/util';

import type { LapisLocation } from '../../views/helpers.ts';
import { GsDateRangeSelector } from '../genspectrum/GsDateRangeSelector.tsx';
import { GsLocationFilter } from '../genspectrum/GsLocationFilter.tsx';

export type LocationFilterConfig = {
    locationFields: string[];
    initialLocation: LapisLocation;
    placeholderText: string;
};

export type DateRangeFilterConfig = {
    initialDateRange: DateRangeOption;
    dateRangeOptions: DateRangeOption[];
    earliestDate: string;
    dateColumn: string;
};

export function BaselineSelector({
    locationFilterConfig,
    onLocationChange,
    dateRangeFilterConfig,
    onDateRangeChange,
    lapisFilter,
}: {
    onLocationChange: (locationFilterConfig: LocationFilterConfig) => void;
    locationFilterConfig: LocationFilterConfig;
    onDateRangeChange: (dateRange: DateRangeOption) => void;
    dateRangeFilterConfig: DateRangeFilterConfig;
    lapisFilter: LapisFilter;
}) {
    return (
        <div className='flex flex-col gap-2'>
            <GsLocationFilter
                onLocationChange={onLocationChange}
                locationFilterConfig={locationFilterConfig}
                lapisFilter={lapisFilter}
            ></GsLocationFilter>
            <GsDateRangeSelector
                lapisDateField={dateRangeFilterConfig.dateColumn}
                onDateRangeChange={onDateRangeChange}
                earliestDate={dateRangeFilterConfig.earliestDate}
                initialValue={dateRangeFilterConfig.initialDateRange}
                dateRangeOptions={dateRangeFilterConfig.dateRangeOptions}
            ></GsDateRangeSelector>
        </div>
    );
}
