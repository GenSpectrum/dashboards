import type { DateRangeOption } from '@genspectrum/dashboard-components/util';
import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector, type DateRangeFilterConfig, type LocationFilterConfig } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { toVariantFilter, type VariantFilterConfig } from './VariantFilterConfig.ts';
import { VariantsSelector } from './VariantsSelector.tsx';
import { type OrganismsConfig } from '../../config.ts';
import type { Id } from '../../views/View.ts';
import { type LapisLocation } from '../../views/helpers.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import type { compareVariantsViewKey } from '../../views/viewKeys.ts';

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

    const currentLapisFilter = useMemo(() => {
        return view.pageStateHandler.datasetFilterToLapisFilter(newPageState.datasetFilter);
    }, [newPageState]);

    return (
        <div className='flex flex-col gap-6'>
            <div>
                <SelectorHeadline>Filter dataset</SelectorHeadline>
                <BaselineSelector
                    onLocationChange={setLocation}
                    locationFilterConfig={{ ...locationFilterConfig, initialLocation: location }}
                    onDateRangeChange={setDateRange}
                    dateRangeFilterConfig={dateRangeFilterConfig}
                    lapisFilter={currentLapisFilter}
                />
            </div>
            <div>
                <SelectorHeadline>Variant Filters</SelectorHeadline>
                <VariantsSelector
                    variantFilterConfigs={variantConfigs}
                    setVariantFilterConfigs={setVariantConfigs}
                    emptyVariantFilterConfigProvider={() => view.pageStateHandler.getEmptyVariantFilterConfig()}
                    lapisFilter={currentLapisFilter}
                />
            </div>
            <ApplyFilterButton pageStateHandler={view.pageStateHandler} newPageState={newPageState} />
        </div>
    );
}
