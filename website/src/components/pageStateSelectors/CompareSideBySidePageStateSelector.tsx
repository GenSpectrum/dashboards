import type { DateRangeOption } from '@genspectrum/dashboard-components/util';
import type { LapisFilter } from '@genspectrum/dashboard-components/util';
import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector, type DateRangeFilterConfig, type LocationFilterConfig } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { toVariantFilter, type VariantFilterConfig } from './VariantFilterConfig.ts';
import { VariantSelector } from './VariantSelector.tsx';
import type { OrganismsConfig } from '../../config.ts';
import type { CovidCompareSideBySideData } from '../../views/covid.ts';
import { type LapisLocation } from '../../views/helpers.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import type { compareSideBySideViewKey } from '../../views/viewKeys.ts';

export function CompareSideBySidePageStateSelector({
    locationFilterConfig,
    dateRangeFilterConfig,
    variantFilterConfig,
    filterId,
    pageState,
    organismViewKey,
    organismsConfig,
    lapisFilter,
}: {
    locationFilterConfig: LocationFilterConfig;
    dateRangeFilterConfig: DateRangeFilterConfig;
    variantFilterConfig: VariantFilterConfig;
    filterId: number;
    pageState: CovidCompareSideBySideData;
    organismViewKey: OrganismViewKey & `${string}.${typeof compareSideBySideViewKey}`;
    organismsConfig: OrganismsConfig;
    lapisFilter: LapisFilter;
}) {
    const [location, setLocation] = useState<LapisLocation>(locationFilterConfig.initialLocation);
    const [dateRange, setDateRange] = useState<DateRangeOption>(dateRangeFilterConfig.initialDateRange);
    const [variantFilterConfigState, setVariantFilterConfigState] = useState<VariantFilterConfig>(variantFilterConfig);

    const view = useMemo(() => new Routing(organismsConfig), [organismsConfig]).getOrganismView(organismViewKey);

    const newPageState = useMemo(() => {
        pageState.filters.set(filterId, {
            datasetFilter: {
                location,
                dateRange,
            },
            variantFilter: toVariantFilter(variantFilterConfigState),
        });

        return pageState;
    }, [location, dateRange, variantFilterConfigState, filterId, pageState]);

    return (
        <div className='flex flex-col gap-4 bg-gray-50 p-2'>
            <div className='flex gap-8'>
                <div className='flex-0'>
                    <SelectorHeadline>Filter dataset</SelectorHeadline>
                    <BaselineSelector
                        onLocationChange={(location) => setLocation(location)}
                        locationFilterConfig={locationFilterConfig}
                        onDateRangeChange={(dateRange) => setDateRange(dateRange)}
                        dateRangeFilterConfig={dateRangeFilterConfig}
                    />
                </div>
                <div className='flex-grow'>
                    <SelectorHeadline>Variant Filter</SelectorHeadline>
                    <VariantSelector
                        onVariantFilterChange={(variantFilter) => setVariantFilterConfigState(variantFilter)}
                        variantFilterConfig={variantFilterConfigState}
                        lapisFilter={lapisFilter}
                    />
                </div>
            </div>
            <div className='flex justify-end'>
                <ApplyFilterButton pageStateHandler={view.pageStateHandler} newPageState={newPageState} />
            </div>
        </div>
    );
}
