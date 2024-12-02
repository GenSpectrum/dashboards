import type { DateRangeOption } from '@genspectrum/dashboard-components/util';
import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector, type DateRangeFilterConfig, type LocationFilterConfig } from './BaselineSelector.tsx';
import type { LineageFilterConfig } from './LineageFilterInput.tsx';
import { type MutationFilterConfig, VariantSelector } from './VariantSelector.tsx';
import { type OrganismsConfig } from '../../config.ts';
import { type LapisLocation, type LapisMutationQuery } from '../../views/helpers.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import type { singleVariantViewKey } from '../../views/viewKeys.ts';

export function SingleVariantPageStateSelector({
    locationFilterConfig,
    dateRangeFilterConfig,
    mutationFilterConfig,
    lineageFilterConfigs,
    organismViewKey,
    organismsConfig,
}: {
    locationFilterConfig: LocationFilterConfig;
    dateRangeFilterConfig: DateRangeFilterConfig;
    mutationFilterConfig: MutationFilterConfig;
    lineageFilterConfigs: LineageFilterConfig[];
    organismViewKey: OrganismViewKey & `${string}.${typeof singleVariantViewKey}`;
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

    const newPageState = useMemo(
        () => ({
            baselineFilter: {
                location,
                dateRange,
            },
            variantFilter: {
                mutations: { ...mutation },
                lineages: { ...lineages },
            },
        }),
        [location, dateRange, mutation, lineages],
    );

    return (
        <div className='flex flex-col gap-6 bg-gray-50 p-2'>
            <BaselineSelector
                onLocationChange={setLocation}
                locationFilterConfig={locationFilterConfig}
                onDateRangeChange={setDateRange}
                dateRangeFilterConfig={dateRangeFilterConfig}
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
            <ApplyFilterButton pageStateHandler={view.pageStateHandler} newPageState={newPageState} />
        </div>
    );
}
