import type { DateRangeOption } from '@genspectrum/dashboard-components/util';

import type { LapisLocation } from '../../views/helpers.ts';
import { GsDateRangeSelector } from '../genspectrum/GsDateRangeSelector.tsx';
import { GsLocationFilter } from '../genspectrum/GsLocationFilter.tsx';
import { GsTextInput } from '../genspectrum/GsTextInput.tsx';

export type LocationFilterConfig = {
    locationFields: string[];
    initialLocation: LapisLocation;
    placeholderText: string;
    label?: string;
};

export type DateRangeFilterConfig = {
    defaultDateRange?: DateRangeOption;
    initialDateRange?: DateRangeOption;
    dateRangeOptions: DateRangeOption[];
    earliestDate: string;
    dateColumn: string;
    label?: string;
};

export type TextInputConfig = {
    lapisField: string;
    placeholderText?: string;
    value?: string
    label?: string;
};

export type BaselineFilterConfig =
    | ({
          type: 'date';
      } & DateRangeFilterConfig)
    | ({ type: 'text' } & TextInputConfig);

export function BaselineSelector({
    locationFilterConfig,
    onLocationChange,
    dateRangeFilterConfig,
    onDateRangeChange,
    baselineFilterConfigs,
    onBaselineFilterConfigChange,
}: {
    onLocationChange: (location: LapisLocation) => void;
    locationFilterConfig: LocationFilterConfig;
    onDateRangeChange: (dateRange: DateRangeOption) => void;
    dateRangeFilterConfig: DateRangeFilterConfig;
    baselineFilterConfigs?: BaselineFilterConfig[];
    onBaselineFilterConfigChange?: (baselineFilterConfigs: BaselineFilterConfig[]) => void;
}) {
    return (
        <div className={`flex flex-col gap-2`}>
            <label className='form-control'>
                <div className='label'>
                    <span className='label-text'>
                        {locationFilterConfig.label ?? locationFilterConfig.placeholderText}
                    </span>
                </div>
                <GsLocationFilter
                    fields={locationFilterConfig.locationFields}
                    onLocationChange={onLocationChange}
                    value={locationFilterConfig.initialLocation}
                    placeholderText={locationFilterConfig.placeholderText}
                ></GsLocationFilter>
            </label>

            <label className='form-control'>
                <div className='label'>
                    <span className='label-text'>{dateRangeFilterConfig.label ?? dateRangeFilterConfig.dateColumn}</span>
                </div>
                <GsDateRangeSelector
                    lapisDateField={dateRangeFilterConfig.dateColumn}
                    onDateRangeChange={onDateRangeChange}
                    earliestDate={dateRangeFilterConfig.earliestDate}
                    initialValue={dateRangeFilterConfig.initialDateRange}
                    dateRangeOptions={dateRangeFilterConfig.dateRangeOptions}
                ></GsDateRangeSelector>
            </label>

            <>
                {baselineFilterConfigs?.map((config: BaselineFilterConfig) => {
                    switch (config.type) {
                        case 'date': {
                            return (
                                <label className='form-control' key={config.dateColumn}>
                                    <div className='label'>
                                        <span className='label-text'>{config.label ?? config.dateColumn}</span>
                                    </div>
                                    <GsDateRangeSelector
                                        lapisDateField={config.dateColumn}
                                        onDateRangeChange={(newDateRange) => {
                                            const newBaselineFilterConfigs = baselineFilterConfigs.map((conf) => {
                                                if (conf.type !== 'date') {
                                                    return conf;
                                                }

                                                return conf.dateColumn === config.dateColumn
                                                    ? { ...conf, initialDateRange: newDateRange }
                                                    : conf;
                                            });
                                            if (onBaselineFilterConfigChange) {
                                                onBaselineFilterConfigChange(newBaselineFilterConfigs);
                                            }
                                        }}
                                        earliestDate={config.earliestDate}
                                        initialValue={config.initialDateRange}
                                        dateRangeOptions={config.dateRangeOptions}
                                    ></GsDateRangeSelector>
                                </label>
                            );
                        }
                        case 'text': {
                            return (
                                <label className='form-control' key={config.lapisField}>
                                    <div className='label'>
                                        <span className='label-text'>{config.label ?? config.lapisField}</span>
                                    </div>
                                    <GsTextInput
                                        value={config.value}
                                        lapisField={config.lapisField}
                                        placeholderText={config.placeholderText}
                                        onInputChange={(input) => {
                                            const newBaselineFilterConfigs = baselineFilterConfigs.map((conf) => {
                                                if (conf.type !== 'text') {
                                                    return conf;
                                                }

                                                return conf.lapisField === config.lapisField
                                                    ? { ...conf, value: input[config.lapisField] }
                                                    : conf;
                                            });
                                            if (onBaselineFilterConfigChange) {
                                                onBaselineFilterConfigChange(newBaselineFilterConfigs);
                                            }
                                        }}
                                    ></GsTextInput>
                                </label>
                            );
                        }
                    }
                })}
            </>
        </div>
    );
}
