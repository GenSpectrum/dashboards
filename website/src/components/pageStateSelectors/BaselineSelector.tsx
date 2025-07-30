import type { DateRangeOption, LapisFilter } from '@genspectrum/dashboard-components/util';

import type { DatasetFilter } from '../../views/View.ts';
import { locationFieldsToFilterIdentifier } from '../../views/pageStateHandlers/locationFilterFromToUrl.ts';
import { AdvancedQueryFilter } from '../genspectrum/AdvancedQueryFilter.tsx';
import { GsDateRangeFilter } from '../genspectrum/GsDateRangeFilter.tsx';
import { GsLocationFilter } from '../genspectrum/GsLocationFilter.tsx';
import { GsNumerRangeFilter } from '../genspectrum/GsNumerRangeFilter.tsx';
import { GsTextFilter } from '../genspectrum/GsTextFilter.tsx';

export type LocationFilterConfig = {
    locationFields: string[];
    placeholderText: string;
    label?: string;
};

export type DateRangeFilterConfig = {
    dateRangeOptions: () => DateRangeOption[];
    dateColumn: string;
    label?: string;
};

export type TextInputConfig = {
    lapisField: string;
    placeholderText?: string;
    label?: string;
};

export type NumberRangeFilterConfig = {
    lapisField: string;
    label?: string;
    sliderMin?: number;
    sliderMax?: number;
    sliderStep?: number;
};

export type BaselineFilterConfig =
    | ({
          type: 'date';
      } & DateRangeFilterConfig)
    | ({ type: 'text' } & TextInputConfig)
    | ({ type: 'location' } & LocationFilterConfig)
    | ({ type: 'number' } & NumberRangeFilterConfig)
    | { type: 'advancedQuery' };

export function BaselineSelector({
    baselineFilterConfigs,
    datasetFilter,
    setDatasetFilter,
    lapisFilter,
    enableAdvancedQueryFilter,
}: {
    datasetFilter: DatasetFilter;
    setDatasetFilter: (datasetFilter: DatasetFilter) => void;
    lapisFilter: LapisFilter;
    baselineFilterConfigs?: BaselineFilterConfig[];
    enableAdvancedQueryFilter: boolean
}) {
    return (
        <div className={`flex flex-col gap-2`}>
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
                                    value={datasetFilter.dateFilters[config.dateColumn]}
                                    dateRangeOptions={config.dateRangeOptions()}
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
                                    lapisFilter={{ ...lapisFilter, [config.lapisField]: undefined }}
                                />
                            </label>
                        );
                    }
                    case 'location': {
                        const filterIdentifier = locationFieldsToFilterIdentifier(config.locationFields);

                        const lapisFilerWithoutLocationFields = Object.fromEntries(
                            Object.entries(lapisFilter).filter(([key]) => !config.locationFields.includes(key)),
                        );

                        return (
                            <label className='form-control' key={`label${filterIdentifier}`}>
                                <div className='label'>
                                    <span className='label-text'>{config.label ?? config.placeholderText}</span>
                                </div>
                                <GsLocationFilter
                                    fields={config.locationFields}
                                    onLocationChange={(newLocation) => {
                                        setDatasetFilter({
                                            ...datasetFilter,
                                            locationFilters: {
                                                ...datasetFilter.locationFilters,
                                                [filterIdentifier]: newLocation,
                                            },
                                        });
                                    }}
                                    value={datasetFilter.locationFilters[filterIdentifier]}
                                    placeholderText={config.placeholderText}
                                    lapisFilter={lapisFilerWithoutLocationFields}
                                ></GsLocationFilter>
                            </label>
                        );
                    }
                    case 'number': {
                        return (
                            <label className='form-control' key={`$label${config.lapisField}`}>
                                <div className='label'>
                                    <span className='label-text'>{config.label ?? config.lapisField}</span>
                                </div>
                                <GsNumerRangeFilter
                                    lapisField={config.lapisField}
                                    sliderMin={config.sliderMin}
                                    sliderMax={config.sliderMax}
                                    sliderStep={config.sliderStep}
                                    value={datasetFilter.numberFilters[config.lapisField]}
                                    onNumberRangeChanged={(newRange) => {
                                        setDatasetFilter({
                                            ...datasetFilter,
                                            numberFilters: {
                                                ...datasetFilter.numberFilters,
                                                [config.lapisField]: newRange,
                                            },
                                        });
                                    }}
                                />
                            </label>
                        );
                    }
                    case 'advancedQuery': {
                        return (
                            <AdvancedQueryFilter
                                key={'advancedQuery'}
                                onInput={(newValue) => {
                                    setDatasetFilter({
                                        ...datasetFilter,
                                        advancedQuery: newValue,
                                    });
                                }}
                                value={datasetFilter.advancedQuery ?? ''}
                                enabled={enableAdvancedQueryFilter}
                            />
                        );
                    }
                }
            })}
        </div>
    );
}
