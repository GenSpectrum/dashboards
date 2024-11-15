import type { DateRangeOption } from '@genspectrum/dashboard-components';
import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector, type DateRangeFilterConfig, type LocationFilterConfig } from './BaselineSelector.tsx';
import { type LineageFilterConfig, type MutationFilterConfig, VariantSelector } from './VariantSelector.tsx';
import { getClientLogger } from '../../clientLogger.ts';
import { type OrganismsConfig } from '../../config.ts';
import type { BaselineAndVariantData } from '../../views/View.ts';
import { type LapisLocation, type LapisMutationQuery } from '../../views/helpers.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';

export function SingleVariantPageStateSelector({
    locationFilterConfig,
    daterRangeFilterConfig,
    mutationFilterConfig,
    lineageFilterConfigs,
    organismViewKey,
    organismsConfig,
    pageState,
}: {
    locationFilterConfig: LocationFilterConfig;
    daterRangeFilterConfig: DateRangeFilterConfig;
    mutationFilterConfig: MutationFilterConfig;
    lineageFilterConfigs: LineageFilterConfig[];
    organismViewKey: OrganismViewKey;
    organismsConfig: OrganismsConfig;
    pageState: BaselineAndVariantData;
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
        const newPageState: BaselineAndVariantData = {
            ...pageState,
            baselineFilter: {
                location,
                dateRange,
            },
            variantFilter: {
                mutations: { ...mutation },
                lineages: { ...lineages },
            },
        };
        window.location.href = view.toUrl(newPageState);
    };

    return (
        <div className='flex flex-col gap-6 bg-gray-50 p-2'>
            <BaselineSelector
                onLocationChange={setLocation}
                locationFilterConfig={locationFilterConfig}
                onDateRangeChange={setDateRange}
                dateRangeFilterConfig={daterRangeFilterConfig}
            />
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
            <ApplyFilterButton onClick={routeToNewPage} />
        </div>
    );
}