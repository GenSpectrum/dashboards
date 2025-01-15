import type { DateRangeOption } from '@genspectrum/dashboard-components/util';
import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import {
    type BaselineFilterConfig,
    BaselineSelector,
    type DateRangeFilterConfig,
    type LocationFilterConfig,
} from './BaselineSelector.tsx';
import { ButtonWithIcon } from './ButtonWithIcon.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { toVariantFilter, type VariantFilterConfig } from './VariantFilterConfig.ts';
import { VariantSelector } from './VariantSelector.tsx';
import { type OrganismsConfig } from '../../config.ts';
import { Inset } from '../../styles/Inset.tsx';
import { type LapisLocation } from '../../views/helpers.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import type { singleVariantViewKey } from '../../views/viewKeys.ts';

export function SingleVariantPageStateSelector({
    locationFilterConfig,
    dateRangeFilterConfig,
    variantFilterConfig,
    organismViewKey,
    organismsConfig,
    baselineFilterConfigs,
}: {
    locationFilterConfig: LocationFilterConfig;
    dateRangeFilterConfig: DateRangeFilterConfig;
    variantFilterConfig: VariantFilterConfig;
    organismViewKey: OrganismViewKey & `${string}.${typeof singleVariantViewKey}`;
    organismsConfig: OrganismsConfig;
    baselineFilterConfigs?: BaselineFilterConfig[];
}) {
    const [location, setLocation] = useState<LapisLocation>(locationFilterConfig.initialLocation);
    const [dateRange, setDateRange] = useState<DateRangeOption | undefined>(dateRangeFilterConfig.initialDateRange);

    const [baselineFilterConfigState, setBaselineFilterConfigState] = useState<BaselineFilterConfig[] | undefined>(
        baselineFilterConfigs,
    );
    const [variantFilterConfigState, setVariantFilterConfigState] = useState<VariantFilterConfig>(variantFilterConfig);

    const view = useMemo(() => new Routing(organismsConfig), [organismsConfig]).getOrganismView(organismViewKey);

    const newPageState = useMemo(() => {
        const additionalFilters = baselineFilterConfigState?.reduce(
            (acc, config) => {
                switch (config.type) {
                    case 'date': {
                        acc[config.dateColumn] = config.initialDateRange;
                        break;
                    }
                    case 'text': {
                        acc[config.lapisField] = config.value;
                        break;
                    }
                }
                return acc;
            },
            {} as {
                [key: string]: DateRangeOption | string | undefined;
            },
        );
        return {
            datasetFilter: {
                location,
                dateRange,
                ...additionalFilters,
            },
            variantFilter: toVariantFilter(variantFilterConfigState),
        };
    }, [location, dateRange, variantFilterConfigState, baselineFilterConfigState]);

    return (
        <div>
            <div className='mb-2 flex justify-end gap-4 text-sm'>
                <ButtonWithIcon icon={'mdi--tooltip-help-outline'}>
                    <div>Help</div>
                </ButtonWithIcon>
                <ButtonWithIcon icon={'mdi--wrench'}>
                    <div>Add filter fields</div>
                </ButtonWithIcon>
                <ButtonWithIcon icon={'mdi--circle-arrows'}>
                    <div>Reset</div>
                </ButtonWithIcon>
            </div>
            <hr className='my-2 border-gray-200' />

            <div className='flex flex-col gap-4'>
                <div>
                    <SelectorHeadline>Filter dataset</SelectorHeadline>
                    <Inset className={'p-2'}>
                        <BaselineSelector
                            onLocationChange={setLocation}
                            locationFilterConfig={locationFilterConfig}
                            onDateRangeChange={setDateRange}
                            dateRangeFilterConfig={dateRangeFilterConfig}
                            baselineFilterConfigs={baselineFilterConfigState}
                            onBaselineFilterConfigChange={setBaselineFilterConfigState}
                        />
                    </Inset>
                </div>

                <div>
                    <SelectorHeadline>Variant Filter</SelectorHeadline>
                    <Inset className={'p-2'}>
                        <VariantSelector
                            onVariantFilterChange={setVariantFilterConfigState}
                            variantFilterConfig={variantFilterConfigState}
                        />
                    </Inset>
                </div>

                <div className='pb-5 w-full backdrop-blur-sm sticky bottom-0 z-10'>

                <ApplyFilterButton
                    className='w-full'
                    pageStateHandler={view.pageStateHandler}
                    newPageState={newPageState}
                />
                </div>
            </div>
        </div>
    );
}
