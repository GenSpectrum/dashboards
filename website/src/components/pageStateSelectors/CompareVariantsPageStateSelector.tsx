import type { DateRangeOption, LapisFilter } from '@genspectrum/dashboard-components/util';
import { useEffect, useMemo, useState } from 'react';

import { BaselineSelector, type DateRangeFilterConfig, type LocationFilterConfig } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { toVariantFilter, type VariantFilterConfig } from './VariantFilterConfig.ts';
import { VariantsSelector } from './VariantsSelector.tsx';
import { type OrganismsConfig } from '../../config.ts';
import type { Id } from '../../views/View.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import type { compareVariantsViewKey } from '../../views/viewKeys.ts';

export function CompareVariantsPageStateSelector({
    locationFilterConfig,
    dateRangeFilterConfig,
    variantFilterConfigs,
    organismViewKey,
    organismsConfig,
    lapisFilter,
}: {
    locationFilterConfig: LocationFilterConfig;
    dateRangeFilterConfig: DateRangeFilterConfig;
    variantFilterConfigs: Map<Id, VariantFilterConfig>;
    organismViewKey: OrganismViewKey & `${string}.${typeof compareVariantsViewKey}`;
    organismsConfig: OrganismsConfig;
    lapisFilter: LapisFilter;
}) {
    const [locationConfig, setLocationConfig] = useState<LocationFilterConfig>(locationFilterConfig);
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
                location: locationConfig.initialLocation,
                dateRange,
            },
            variants,
        };
    }, [locationConfig, dateRange, variantConfigs]);

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
                    onLocationChange={setLocationConfig}
                    locationFilterConfig={locationFilterConfig}
                    onDateRangeChange={setDateRange}
                    dateRangeFilterConfig={dateRangeFilterConfig}
                    lapisFilter={lapisFilter}
                />
            </div>
            <div>
                <SelectorHeadline>Variant Filters</SelectorHeadline>
                <VariantsSelector
                    variantFilterConfigs={variantConfigs}
                    lapisFilter={lapisFilter}
                    setVariantFilterConfigs={setVariantConfigs}
                    emptyVariantFilterConfigProvider={() => view.pageStateHandler.getEmptyVariantFilterConfig()}
                />
            </div>
        </div>
    );
}
