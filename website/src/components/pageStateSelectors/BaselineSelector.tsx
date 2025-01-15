import type { DateRangeOption } from '@genspectrum/dashboard-components/util';

import type { LapisLocation } from '../../views/helpers.ts';
import { GsDateRangeSelector } from '../genspectrum/GsDateRangeSelector.tsx';
import { GsLocationFilter } from '../genspectrum/GsLocationFilter.tsx';
import { GsTextInput } from '../genspectrum/GsTextInput.tsx';
import {useState} from "react";

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
}: {
    onLocationChange: (location: LapisLocation) => void;
    locationFilterConfig: LocationFilterConfig;
    onDateRangeChange: (dateRange: DateRangeOption) => void;
    dateRangeFilterConfig: DateRangeFilterConfig;
}) {
    const [openLarge, setOpenLarge] = useState(false)

    return (
        <div>
            <div className={`flex flex-col gap-2 overflow-y-scroll ${openLarge ? 'max-h-[100vh]' : 'max-h-[35vh]'}`}>
                <GsLocationFilter
                    fields={locationFilterConfig.locationFields}
                    onLocationChange={onLocationChange}
                    initialValue={locationFilterConfig.locationFields
                        .map((field) => locationFilterConfig.initialLocation[field])
                        .filter(Boolean)
                        .join(' / ')}
                    placeholderText={locationFilterConfig.placeholderText}
                ></GsLocationFilter>
                <GsDateRangeSelector
                    lapisDateField={dateRangeFilterConfig.dateColumn}
                    onDateRangeChange={onDateRangeChange}
                    earliestDate={dateRangeFilterConfig.earliestDate}
                    initialValue={dateRangeFilterConfig.initialDateRange}
                    dateRangeOptions={dateRangeFilterConfig.dateRangeOptions}
                ></GsDateRangeSelector>
                <GsTextInput lapisField={'age'} placeholderText={'Age'}></GsTextInput>
                <GsDateRangeSelector
                    lapisDateField={dateRangeFilterConfig.dateColumn}
                    onDateRangeChange={onDateRangeChange}
                    earliestDate={dateRangeFilterConfig.earliestDate}
                    initialValue={dateRangeFilterConfig.initialDateRange}
                    dateRangeOptions={dateRangeFilterConfig.dateRangeOptions}
                ></GsDateRangeSelector>
                <GsTextInput lapisField={'host'} placeholderText={'Host'}></GsTextInput>
                <GsTextInput lapisField={'submittingLab'} placeholderText={'Submitting lab'}></GsTextInput>
                <GsTextInput lapisField={'samplingStrategy'} placeholderText={'Sampling strategy'}></GsTextInput>
            </div>
            <button className='mb-4' onClick={() => setOpenLarge(!openLarge)}>
                {openLarge? "Arrow up" : "Arrow down"}
            </button>
        </div>
    );
}
