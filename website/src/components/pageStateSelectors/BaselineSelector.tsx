import type { DateRangeOption } from '@genspectrum/dashboard-components/util';

import type { LapisLocation } from '../../views/helpers.ts';
import { GsDateRangeSelector } from '../genspectrum/GsDateRangeSelector.tsx';
import { GsLocationFilter } from '../genspectrum/GsLocationFilter.tsx';
import { GsTextInput } from '../genspectrum/GsTextInput.tsx';
import { useState } from 'react';

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
    const [openLarge, setOpenLarge] = useState(false);

    return (
        <div>
            <div
                className={`flex flex-col gap-2 overflow-y-scroll ${openLarge ? 'max-h-[100vh]' : 'max-h-[35vh]'} rounded-md bg-white p-2`}
            >
                <label className='form-control w-full'>
                    <div className='label'>
                        <span className='label-text'>Sampling location</span>
                    </div>
                    <GsLocationFilter
                        fields={locationFilterConfig.locationFields}
                        onLocationChange={onLocationChange}
                        initialValue={locationFilterConfig.locationFields
                            .map((field) => locationFilterConfig.initialLocation[field])
                            .filter(Boolean)
                            .join(' / ')}
                        placeholderText={locationFilterConfig.placeholderText}
                    ></GsLocationFilter>
                </label>

                <label className='form-control'>
                    <div className='label'>
                        <span className='label-text'>Date</span>
                    </div>
                    <GsDateRangeSelector
                        lapisDateField={dateRangeFilterConfig.dateColumn}
                        onDateRangeChange={onDateRangeChange}
                        earliestDate={dateRangeFilterConfig.earliestDate}
                        initialValue={dateRangeFilterConfig.initialDateRange}
                        dateRangeOptions={dateRangeFilterConfig.dateRangeOptions}
                    ></GsDateRangeSelector>
                </label>

                <label className='form-control'>
                    <div className='label'>
                        <span className='label-text'>Age</span>
                    </div>
                    <GsTextInput lapisField={'age'} placeholderText={'Age'}></GsTextInput>
                </label>

                <label className='form-control'>
                    <div className='label'>
                        <span className='label-text'>Some other date</span>
                    </div>
                    <GsDateRangeSelector
                        lapisDateField={dateRangeFilterConfig.dateColumn}
                        onDateRangeChange={onDateRangeChange}
                        earliestDate={dateRangeFilterConfig.earliestDate}
                        initialValue={dateRangeFilterConfig.initialDateRange}
                        dateRangeOptions={dateRangeFilterConfig.dateRangeOptions}
                    ></GsDateRangeSelector>
                </label>


                <label className='form-control'>
                    <div className='label'>
                        <span className='label-text'>Host</span>
                    </div>
                    <GsTextInput lapisField={'host'} placeholderText={'Host'}></GsTextInput>
                </label>

                <label className='form-control'>
                    <div className='label'>
                        <span className='label-text'>Submitting lab</span>
                    </div>
                    <GsTextInput lapisField={'submittingLab'} placeholderText={'Submitting lab'}></GsTextInput>
                </label>


                <label className='form-control'>
                    <div className='label'>
                        <span className='label-text'>Sampling strategy</span>
                    </div>
                    <GsTextInput lapisField={'samplingStrategy'} placeholderText={'Sampling strategy'}></GsTextInput>
                </label>
                <div></div>

            </div>
            <button className='mb-4 mt-2' onClick={() => setOpenLarge(!openLarge)}>
                {openLarge ? (
                    <>
                        <span className='iconify mdi--keyboard-arrow-up'></span>
                        <span className='text-info'>See less</span>
                    </>
                ) : (
                    <>
                        <span className='iconify mdi--keyboard-arrow-down'></span>
                        <span className='text-info'>See more</span>
                    </>
                )}
            </button>
        </div>
    );
}
