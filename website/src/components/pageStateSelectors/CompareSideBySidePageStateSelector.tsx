import type { DateRangeOption } from '@genspectrum/dashboard-components';
import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector, type DateRangeFilterConfig, type LocationFilterConfig } from './BaselineSelector.tsx';
import { type LineageFilterConfig, type MutationFilterConfig, VariantSelector } from './VariantSelector.tsx';
import { getClientLogger } from '../../clientLogger.ts';
import type { OrganismsConfig } from '../../config.ts';
import type { CovidCompareVariantsData } from '../../views/covid.ts';
import { type LapisLocation, type LapisMutationQuery } from '../../views/helpers.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';

export function CompareSideBySidePageStateSelector({
    locationFilterConfig,
    daterRangeFilterConfig,
    mutationFilterConfig,
    lineageFilterConfigs,
    filterId,
    pageState,
    organismViewKey,
    organismsConfig,
}: {
    locationFilterConfig: LocationFilterConfig;
    daterRangeFilterConfig: DateRangeFilterConfig;
    mutationFilterConfig: MutationFilterConfig;
    lineageFilterConfigs: LineageFilterConfig[];
    filterId: number;
    pageState: CovidCompareVariantsData;
    organismViewKey: OrganismViewKey;
    organismsConfig: OrganismsConfig;
}) {
    const [location, setLocation] = useState<LapisLocation>(locationFilterConfig.initialLocation);
    const [dateRange, setDateRange] = useState<DateRangeOption>(daterRangeFilterConfig.initialDateRange);
    const [mutation, setMutation] = useState<LapisMutationQuery | undefined>(mutationFilterConfig.initialMutations);
    const [lineages, setLineages] = useState<Record<string, string | undefined>>(
        lineageFilterConfigs.reduce((acc: Record<string, string | undefined>, config) => {
            acc[config.lapisField] = config.initialValue;
            return acc;
        }, {}),
    );
    const view = useMemo(() => new Routing(organismsConfig, getClientLogger), [organismsConfig]).getOrganismView(
        organismViewKey,
    );

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

        window.location.href = view.toUrl(pageState);
    };

    return (
        <div className='flex flex-col gap-4 bg-gray-100 p-2'>
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
