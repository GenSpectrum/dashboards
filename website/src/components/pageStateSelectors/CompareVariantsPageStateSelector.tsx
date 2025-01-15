import type { DateRangeOption } from '@genspectrum/dashboard-components/util';
import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector, type DateRangeFilterConfig, type LocationFilterConfig } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { toVariantFilter, type VariantFilterConfig } from './VariantFilterConfig.ts';
import { VariantsSelector } from './VariantsSelector.tsx';
import { type OrganismsConfig } from '../../config.ts';
import { Inset } from '../../styles/Inset.tsx';
import type { Id } from '../../views/View.ts';
import { type LapisLocation } from '../../views/helpers.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import type { compareVariantsViewKey } from '../../views/viewKeys.ts';
import { ButtonWithIcon } from './ButtonWithIcon.tsx';

export function CompareVariantsPageStateSelector({
    locationFilterConfig,
    dateRangeFilterConfig,
    variantFilterConfigs,
    organismViewKey,
    organismsConfig,
}: {
    locationFilterConfig: LocationFilterConfig;
    dateRangeFilterConfig: DateRangeFilterConfig;
    variantFilterConfigs: Map<Id, VariantFilterConfig>;
    organismViewKey: OrganismViewKey & `${string}.${typeof compareVariantsViewKey}`;
    organismsConfig: OrganismsConfig;
}) {
    const [location, setLocation] = useState<LapisLocation>(locationFilterConfig.initialLocation);
    const [dateRange, setDateRange] = useState<DateRangeOption>(dateRangeFilterConfig.initialDateRange);

    const [variantConfigs, setVariantConfigs] = useState<Map<Id, VariantFilterConfig>>(variantFilterConfigs);

    const view = useMemo(
        () => new Routing(organismsConfig).getOrganismView(organismViewKey),
        [organismsConfig, organismViewKey],
    );

    const newPageState = useMemo(() => {
        const variants = new Map(
            Array.from(variantConfigs).map(([id, variantFilterConfig]) => {
                return [id, toVariantFilter(variantFilterConfig)];
            }),
        );

        return {
            datasetFilter: {
                location,
                dateRange,
            },
            variants,
        };
    }, [location, dateRange, variantConfigs]);

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
                    <Inset className='p-2'>
                        <BaselineSelector
                            onLocationChange={setLocation}
                            locationFilterConfig={locationFilterConfig}
                            onDateRangeChange={setDateRange}
                            dateRangeFilterConfig={dateRangeFilterConfig}
                        />
                    </Inset>
                </div>
                <div>
                    <SelectorHeadline>Variant Filters</SelectorHeadline>
                    <Inset className='p-2'>
                        <VariantsSelector
                            variantFilterConfigs={variantConfigs}
                            setVariantFilterConfigs={setVariantConfigs}
                            emptyVariantFilterConfigProvider={() => view.pageStateHandler.getEmptyVariantFilterConfig()}
                        />
                    </Inset>
                </div>
                <ApplyFilterButton pageStateHandler={view.pageStateHandler} newPageState={newPageState} />
            </div>
        </div>
    );
}
