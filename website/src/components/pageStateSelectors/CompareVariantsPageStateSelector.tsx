import type { DateRangeOption } from '@genspectrum/dashboard-components/util';
import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector, type DateRangeFilterConfig, type LocationFilterConfig } from './BaselineSelector.tsx';
import type { LineageFilterConfig } from './LineageFilterInput.tsx';
import { VariantsSelector } from './VariantsSelector.tsx';
import { type OrganismsConfig } from '../../config.ts';
import type { CompareVariantsData, Id, VariantFilter } from '../../views/View.ts';
import { type LapisLocation, type LapisMutationQuery } from '../../views/helpers.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import type { compareVariantsViewKey } from '../../views/viewKeys.ts';

export type VariantFilterConfig = {
    lineageFilterConfigs: LineageFilterConfig[];
    mutationFilterConfig: LapisMutationQuery;
};

function toVariantFilter(variantFilterConfig: VariantFilterConfig): VariantFilter {
    return {
        mutations: variantFilterConfig.mutationFilterConfig,
        lineages: variantFilterConfig.lineageFilterConfigs.reduce((acc, lineageFilterConfig) => {
            return { ...acc, [lineageFilterConfig.lapisField]: lineageFilterConfig.initialValue };
        }, {}),
    };
}

export function CompareVariantsPageStateSelector({
    locationFilterConfig,
    dateRangeFilterConfig,
    variantFilterConfigs,
    emptyVariantFilterConfig,
    organismViewKey,
    organismsConfig,
    pageState,
}: {
    locationFilterConfig: LocationFilterConfig;
    dateRangeFilterConfig: DateRangeFilterConfig;
    variantFilterConfigs: Map<Id, VariantFilterConfig>;
    emptyVariantFilterConfig: VariantFilterConfig;
    organismViewKey: OrganismViewKey & `${string}.${typeof compareVariantsViewKey}`;
    organismsConfig: OrganismsConfig;
    pageState: CompareVariantsData;
}) {
    const [location, setLocation] = useState<LapisLocation>(locationFilterConfig.initialLocation);
    const [dateRange, setDateRange] = useState<DateRangeOption>(dateRangeFilterConfig.initialDateRange);

    const [variantConfigs, setVariantConfigs] = useState<Map<Id, VariantFilterConfig>>(variantFilterConfigs);

    const view = useMemo(
        () => new Routing(organismsConfig).getOrganismView(organismViewKey),
        [organismsConfig, organismViewKey],
    );

    const routeToNewPage = () => {
        const variants = new Map(
            Array.from(variantConfigs).map(([id, variantFilterConfig]) => {
                return [id, toVariantFilter(variantFilterConfig)];
            }),
        );

        const newPageState: CompareVariantsData = {
            ...pageState,
            baselineFilter: {
                location,
                dateRange,
            },
            variants,
        };

        window.location.href = view.pageStateHandler.toUrl(newPageState);
    };

    return (
        <div className='flex flex-col gap-6 bg-gray-50 p-2'>
            <BaselineSelector
                onLocationChange={setLocation}
                locationFilterConfig={locationFilterConfig}
                onDateRangeChange={setDateRange}
                dateRangeFilterConfig={dateRangeFilterConfig}
            />
            <VariantsSelector
                variantFilterConfigs={variantConfigs}
                setVariantFilterConfigs={setVariantConfigs}
                emptyVariantFilterConfig={emptyVariantFilterConfig}
            />
            <ApplyFilterButton onClick={routeToNewPage} />
        </div>
    );
}
