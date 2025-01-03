import type { DateRangeOption } from '@genspectrum/dashboard-components/util';
import type { LapisFilter } from '@genspectrum/dashboard-components/util';
import { useEffect, useMemo, useState } from 'react';

import { BaselineSelector, type DateRangeFilterConfig, type LocationFilterConfig } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { toVariantFilter, type VariantFilterConfig } from './VariantFilterConfig.ts';
import { VariantSelector } from './VariantSelector.tsx';
import type { OrganismsConfig } from '../../config.ts';
import type { CovidCompareSideBySideData } from '../../views/covid.ts';
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
    const [locationConfig, setLocationConfig] = useState<LocationFilterConfig>(locationFilterConfig);
    const [dateRange, setDateRange] = useState<DateRangeOption>(dateRangeFilterConfig.initialDateRange);
    const [variantFilterConfigState, setVariantFilterConfigState] = useState<VariantFilterConfig>(variantFilterConfig);

    const view = useMemo(() => new Routing(organismsConfig), [organismsConfig]).getOrganismView(organismViewKey);

    const newPageState = useMemo(() => {
        const updatedFilters = new Map(pageState.filters);
        updatedFilters.set(filterId, {
            datasetFilter: {
                location: locationConfig.initialLocation,
                dateRange,
            },
            variantFilter: toVariantFilter(variantFilterConfigState),
        });

        return {
            ...pageState,
            filters: updatedFilters,
        };
    }, [locationConfig, dateRange, variantFilterConfigState, filterId, pageState]);

    useEffect(() => {
        const newUrl = view.pageStateHandler.toUrl(newPageState);

        const currentUrl = new URL(window.location.href);
        const targetUrl = new URL(newUrl, window.location.origin);

        if (currentUrl.href !== targetUrl.href) {
            window.location.href = targetUrl.href;
        }
    }, [newPageState, view]);

    return (
        <div className='flex flex-col gap-4 bg-gray-50 p-2'>
            <div className='flex gap-8'>
                <div className='flex-0'>
                    <SelectorHeadline>Filter dataset</SelectorHeadline>
                    <BaselineSelector
                        onLocationChange={(locationConfig) => setLocationConfig(locationConfig)}
                        locationFilterConfig={locationFilterConfig}
                        onDateRangeChange={(dateRange) => setDateRange(dateRange)}
                        dateRangeFilterConfig={dateRangeFilterConfig}
                        lapisFilter={lapisFilter}
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
        </div>
    );
}
