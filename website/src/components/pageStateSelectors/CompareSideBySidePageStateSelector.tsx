import type { DateRangeOption } from '@genspectrum/dashboard-components';
import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector, type DateRangeFilterConfig, type LocationFilterConfig } from './BaselineSelector.tsx';
import { type LineageFilterConfig, type MutationFilterConfig, VariantSelector } from './VariantSelector.tsx';
import { getClientLogger } from '../../clientLogger.ts';
import type { OrganismsConfig } from '../../config.ts';
import type { CovidCompareVariantsData } from '../../views/covid.ts';
import { type LapisLocation, type LapisMutationQuery, lineageKey } from '../../views/helpers.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';

export function CompareSideBySidePageStateSelector({
    locationFilterConfig,
    daterRangeFilterConfig,
    mutationFilterConfig,
    lineageFilterConfig,
    filterId,
    pageState,
    organismViewKey,
    organismsConfig,
}: {
    locationFilterConfig: LocationFilterConfig;
    organismConfig: OrganismsConfig;
    daterRangeFilterConfig: DateRangeFilterConfig;
    mutationFilterConfig: MutationFilterConfig;
    lineageFilterConfig?: LineageFilterConfig;
    filterId: number;
    pageState: CovidCompareVariantsData;
    organismViewKey: OrganismViewKey;
    organismsConfig: OrganismsConfig;
}) {
    const [location, setLocation] = useState<LapisLocation>(locationFilterConfig.initialLocation);
    const [dateRange, setDateRange] = useState<DateRangeOption>(daterRangeFilterConfig.initialDateRange);
    const [mutation, setMutation] = useState<LapisMutationQuery | undefined>(mutationFilterConfig.initialMutations);
    const [lineage, setLineage] = useState<string | undefined>(lineageFilterConfig?.initialValue);
    const view = useMemo(() => new Routing(organismsConfig, getClientLogger), [organismsConfig]).getOrganismView(
        organismViewKey,
    );

    const routeToNewPage = () => {
        const lineageVariantFilter = lineageFilterConfig ? { [lineageKey]: lineage } : {};

        pageState.filters.set(filterId, {
            baselineFilter: {
                location,
                dateRange,
            },
            variantFilter: {
                ...mutation,
                ...lineageVariantFilter,
            },
        });

        window.location.href = view.toUrl(pageState);
    };

    return (
        <div className='flex flex-col gap-4 bg-gray-50 p-2'>
            <div className='flex gap-8'>
                <div className='flex-0'>
                    <BaselineSelector
                        onLocationChange={(location) => setLocation(location)}
                        locationFilterConfig={locationFilterConfig}
                        onDateRangeChange={(dateRange) => setDateRange(dateRange)}
                        dateRangeFilterConfig={daterRangeFilterConfig}
                    />
                </div>
                <div className='flex-grow'>
                    <VariantSelector
                        onMutationChange={setMutation}
                        mutationFilterConfig={mutationFilterConfig}
                        lineageFilterConfig={lineageFilterConfig}
                        onLineageChange={setLineage}
                        onCladeChange={() => {}}
                    />
                </div>
            </div>
            <div className='flex justify-end'>
                <ApplyFilterButton onClick={routeToNewPage} className='btn-sm max-w-64' />
            </div>
        </div>
    );
}
