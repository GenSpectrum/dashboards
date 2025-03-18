import type { DateRangeOption, LapisFilter } from '@genspectrum/dashboard-components/util';

import type { DatasetFilter } from '../../views/View.ts';
import { GsDateRangeFilter } from '../genspectrum/GsDateRangeFilter.tsx';
import { GsLocationFilter } from '../genspectrum/GsLocationFilter.tsx';
import { GsTextFilter } from '../genspectrum/GsTextFilter.tsx';

export type LocationFilterConfig = {
    locationFields: string[];
    placeholderText: string;
    label?: string;
};

export type DateRangeFilterConfig = {
    dateRangeOptions: DateRangeOption[];
    earliestDate: string;
    dateColumn: string;
    label?: string;
};

export type TextInputConfig = {
    lapisField: string;
    placeholderText?: string;
    label?: string;
};

export type BaselineFilterConfig =
    | ({
          type: 'date';
      } & DateRangeFilterConfig)
    | ({ type: 'text' } & TextInputConfig);

export function BaselineSelector({
    locationFilterConfig,
    baselineFilterConfigs,
    datasetFilter,
    setDatasetFilter,
    lapisFilter,
}: {
    datasetFilter: DatasetFilter;
    setDatasetFilter: (datasetFilter: DatasetFilter) => void;
    lapisFilter: LapisFilter;
    locationFilterConfig?: LocationFilterConfig;
    baselineFilterConfigs?: BaselineFilterConfig[];
}) {
    return (
        <div className={`flex flex-col gap-2`}>
            {locationFilterConfig !== undefined && (
                <label className='form-control'>
                    <div className='label'>
                        <span className='label-text'>
                            {locationFilterConfig.label ?? locationFilterConfig.placeholderText}
                        </span>
                    </div>
                    <GsLocationFilter
                        fields={locationFilterConfig.locationFields}
                        onLocationChange={(newLocation) => {
                            setDatasetFilter({
                                ...datasetFilter,
                                location: newLocation,
                            });
                        }}
                        value={datasetFilter.location}
                        placeholderText={locationFilterConfig.placeholderText}
                        lapisFilter={lapisFilter}
                    ></GsLocationFilter>
                </label>
            )}

            <>
                {baselineFilterConfigs?.map((config: BaselineFilterConfig) => {
                    switch (config.type) {
                        case 'date': {
                            return (
                                <label className='form-control' key={`label${config.dateColumn}`}>
                                    <div className='label'>
                                        <span className='label-text'>{config.label ?? config.dateColumn}</span>
                                    </div>
                                    <GsDateRangeFilter
                                        lapisDateField={config.dateColumn}
                                        onDateRangeChange={(newDateRange) => {
                                            setDatasetFilter({
                                                ...datasetFilter,
                                                dateFilters: {
                                                    ...datasetFilter.dateFilters,
                                                    [config.dateColumn]: newDateRange,
                                                },
                                            });
                                        }}
                                        earliestDate={config.earliestDate}
                                        value={datasetFilter.dateFilters[config.dateColumn]}
                                        dateRangeOptions={config.dateRangeOptions}
                                    />
                                </label>
                            );
                        }
                        case 'text': {
                            return (
                                <label className='form-control' key={`$label${config.lapisField}`}>
                                    <div className='label'>
                                        <span className='label-text'>{config.label ?? config.lapisField}</span>
                                    </div>
                                    <GsTextFilter
                                        value={datasetFilter.textFilters[config.lapisField]}
                                        lapisField={config.lapisField}
                                        placeholderText={config.placeholderText}
                                        onInputChange={(input) => {
                                            setDatasetFilter({
                                                ...datasetFilter,
                                                textFilters: {
                                                    ...datasetFilter.textFilters,
                                                    ...input,
                                                },
                                            });
                                        }}
                                        lapisFilter={lapisFilter}
                                    />
                                </label>
                            );
                        }
                    }
                })}
            </>
        </div>
    );
}
