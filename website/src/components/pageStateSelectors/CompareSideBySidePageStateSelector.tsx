import type { DateRangeOption } from '@genspectrum/dashboard-components/util';
import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector, type DateRangeFilterConfig, type LocationFilterConfig } from './BaselineSelector.tsx';
import { type LineageFilterConfig, type MutationFilterConfig, VariantSelector } from './VariantSelector.tsx';
import type { OrganismsConfig } from '../../config.ts';
import type { CovidCompareSideBySideData } from '../../views/covid.ts';
import { type LapisLocation, type LapisMutationQuery } from '../../views/helpers.ts';
import { type compareSideBySideViewKey, type OrganismViewKey, Routing } from '../../views/routing.ts';

export function CompareSideBySidePageStateSelector({
    locationFilterConfig,
    dateRangeFilterConfig,
    mutationFilterConfig,
    lineageFilterConfigs,
    filterId,
    pageState,
    organismViewKey,
    organismsConfig,
}: {
    locationFilterConfig: LocationFilterConfig;
    dateRangeFilterConfig: DateRangeFilterConfig;
    mutationFilterConfig: MutationFilterConfig;
    lineageFilterConfigs: LineageFilterConfig[];
    filterId: number;
    pageState: CovidCompareSideBySideData;
    organismViewKey: OrganismViewKey & `${string}.${typeof compareSideBySideViewKey}`;
    organismsConfig: OrganismsConfig;
}) {
    const [location, setLocation] = useState<LapisLocation>(locationFilterConfig.initialLocation);
    const [dateRange, setDateRange] = useState<DateRangeOption>(dateRangeFilterConfig.initialDateRange);
    const [mutation, setMutation] = useState<LapisMutationQuery | undefined>(mutationFilterConfig.initialMutations);
    const [lineages, setLineages] = useState<Record<string, string | undefined>>(
        lineageFilterConfigs.reduce((acc: Record<string, string | undefined>, config) => {
            acc[config.lapisField] = config.initialValue;
            return acc;
        }, {}),
    );
    const view = useMemo(() => new Routing(organismsConfig), [organismsConfig]).getOrganismView(organismViewKey);

    const routeToNewPage = () => {
        pageState.filters.set(filterId, {
            baselineFilter: {
                location,
                dateRange,
            },
            variantFilter: {
                mutations: { ...mutation },
                lineages: { ...lineages },
            },
        });

        window.location.href = view.pageStateHandler.toUrl(pageState);
    };

    return (
        <div className='flex flex-col gap-4 bg-gray-50 p-2'>
            <div className='flex gap-8'>
                <div className='flex-0'>
                    <BaselineSelector
                        onLocationChange={(location) => setLocation(location)}
                        locationFilterConfig={locationFilterConfig}
                        onDateRangeChange={(dateRange) => setDateRange(dateRange)}
                        dateRangeFilterConfig={dateRangeFilterConfig}
                    />
                </div>
                <div className='flex-grow'>
                    <VariantSelector
                        onMutationChange={setMutation}
                        mutationFilterConfig={mutationFilterConfig}
                        lineageFilterConfigs={lineageFilterConfigs.map((lineageFilterConfig) => ({
                            lineageFilterConfig,
                            onLineageChange: (lineage) => {
                                setLineages((lineages) => ({
                                    ...lineages,
                                    [lineageFilterConfig.lapisField]: lineage,
                                }));
                            },
                        }))}
                    />
                </div>
            </div>
            <div className='flex justify-end'>
                <ApplyFilterButton onClick={routeToNewPage} className='btn-sm max-w-64' />
            </div>
        </div>
    );
}
