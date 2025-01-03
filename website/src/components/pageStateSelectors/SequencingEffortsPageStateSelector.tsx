import type { DateRangeOption } from '@genspectrum/dashboard-components/util';
import type { LapisFilter } from '@genspectrum/dashboard-components/util';
import { useEffect, useMemo, useState } from 'react';

import { BaselineSelector, type DateRangeFilterConfig, type LocationFilterConfig } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { toVariantFilter, type VariantFilterConfig } from './VariantFilterConfig.ts';
import { VariantSelector } from './VariantSelector.tsx';
import type { OrganismsConfig } from '../../config.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import type { sequencingEffortsViewKey } from '../../views/viewKeys.ts';

export function SequencingEffortsPageStateSelector({
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
    organismViewKey: OrganismViewKey & `${string}.${typeof sequencingEffortsViewKey}`;
    organismsConfig: OrganismsConfig;
    lapisFilter: LapisFilter;
}) {
    const [locationConfig, setLocationConfig] = useState<LocationFilterConfig>(locationFilterConfig);
    const [variantFilterConfigState, setVariantFilterConfigState] = useState<VariantFilterConfig>(variantFilterConfig);
    const [dateRange, setDateRange] = useState<DateRangeOption>(dateRangeFilterConfig.initialDateRange);
    const view = useMemo(() => new Routing(organismsConfig), [organismsConfig]).getOrganismView(organismViewKey);

    const newPageState = useMemo(
        () => ({
            datasetFilter: {
                location: locationConfig.initialLocation,
                dateRange,
            },
            variantFilter: toVariantFilter(variantFilterConfigState),
        }),
        [locationConfig, dateRange, variantFilterConfigState],
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
                    onLocationChange={(locationConfig) => setLocationConfig(locationConfig)}
                    locationFilterConfig={locationFilterConfig}
                    onDateRangeChange={(dateRange) => setDateRange(dateRange)}
                    dateRangeFilterConfig={dateRangeFilterConfig}
                    lapisFilter={lapisFilter}
                />
            </div>
            <div>
                <VariantSelector
                    onVariantFilterChange={setVariantFilterConfigState}
                    variantFilterConfig={variantFilterConfigState}
                    hideMutationFilter={true}
                    lapisFilter={lapisFilter}
                />
            </div>
        </div>
    );
}
