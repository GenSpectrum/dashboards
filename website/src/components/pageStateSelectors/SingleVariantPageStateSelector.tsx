import type { DateRangeOption } from '@genspectrum/dashboard-components/util';
import type { LapisFilter } from '@genspectrum/dashboard-components/util';
import { useEffect, useMemo, useState } from 'react';

import { BaselineSelector, type DateRangeFilterConfig, type LocationFilterConfig } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { toVariantFilter, type VariantFilterConfig } from './VariantFilterConfig.ts';
import { VariantSelector } from './VariantSelector.tsx';
import { type OrganismsConfig } from '../../config.ts';
import { type LapisLocation } from '../../views/helpers.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import type { singleVariantViewKey } from '../../views/viewKeys.ts';

export function SingleVariantPageStateSelector({
    locationFilterConfig,
    dateRangeFilterConfig,
    variantFilterConfig,
    organismViewKey,
    organismsConfig,
    lapisFilter,
}: {
    locationFilterConfig: LocationFilterConfig;
    dateRangeFilterConfig: DateRangeFilterConfig;
    variantFilterConfig: VariantFilterConfig;
    organismViewKey: OrganismViewKey & `${string}.${typeof singleVariantViewKey}`;
    organismsConfig: OrganismsConfig;
    lapisFilter: LapisFilter;
}) {
    const [location, setLocation] = useState<LapisLocation>(locationFilterConfig.initialLocation);
    const [dateRange, setDateRange] = useState<DateRangeOption>(dateRangeFilterConfig.initialDateRange);

    const [variantFilterConfigState, setVariantFilterConfigState] = useState<VariantFilterConfig>(variantFilterConfig);

    const view = useMemo(() => new Routing(organismsConfig), [organismsConfig]).getOrganismView(organismViewKey);

    const newPageState = useMemo(
        () => ({
            datasetFilter: {
                location,
                dateRange,
            },
            variantFilter: toVariantFilter(variantFilterConfigState),
        }),
        [location, dateRange, variantFilterConfigState],
    );

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const newUrl = view.pageStateHandler.toUrl(newPageState);

            const currentUrl = new URL(window.location.href);
            const targetUrl = new URL(newUrl, window.location.origin);

            if (currentUrl.href !== targetUrl.href) {
                window.location.href = targetUrl.href;
            }
        }
    }, [newPageState, view]);

    return (
        <div className='flex flex-col gap-6'>
            <div>
                <SelectorHeadline>Filter dataset</SelectorHeadline>
                <BaselineSelector
                    onLocationChange={setLocation}
                    locationFilterConfig={locationFilterConfig}
                    onDateRangeChange={setDateRange}
                    dateRangeFilterConfig={dateRangeFilterConfig}
                />
            </div>
            <div>
                <SelectorHeadline>Variant Filter</SelectorHeadline>
                <VariantSelector
                    onVariantFilterChange={setVariantFilterConfigState}
                    variantFilterConfig={variantFilterConfigState}
                    lapisFilter={lapisFilter}
                />
            </div>
        </div>
    );
}
