import type { DateRangeOption } from '@genspectrum/dashboard-components';
import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector, type DateRangeFilterConfig, type LocationFilterConfig } from './BaselineSelector.tsx';
import {
    type LineageFilterConfig,
    type MutationFilterConfig,
    type TextFilterConfig,
    VariantSelector,
} from './VariantSelector.tsx';
import { getClientLogger } from '../../clientLogger.ts';
import { type OrganismsConfig } from '../../config.ts';
import type { BaselineAndVariantData } from '../../views/View.ts';
import { cladeKey, type LapisLocation, type LapisMutationQuery, lineageKey } from '../../views/helpers.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';

export function SingleVariantPageStateSelector({
    locationFilterConfig,
    daterRangeFilterConfig,
    mutationFilterConfig,
    lineageFilterConfig,
    cladeFilterConfig,
    organismViewKey,
    organismsConfig,
    pageState,
}: {
    locationFilterConfig: LocationFilterConfig;
    daterRangeFilterConfig: DateRangeFilterConfig;
    mutationFilterConfig: MutationFilterConfig;
    lineageFilterConfig?: LineageFilterConfig;
    cladeFilterConfig?: TextFilterConfig;
    organismViewKey: OrganismViewKey;
    organismsConfig: OrganismsConfig;
    pageState: BaselineAndVariantData;
}) {
    const [location, setLocation] = useState<LapisLocation>(locationFilterConfig.initialLocation);
    const [dateRange, setDateRange] = useState<DateRangeOption>(daterRangeFilterConfig.initialDateRange);
    const [mutation, setMutation] = useState<LapisMutationQuery | undefined>(mutationFilterConfig.initialMutations);
    const [lineage, setLineage] = useState<string | undefined>(lineageFilterConfig?.initialValue);
    const [clade, setClade] = useState<string | undefined>(cladeFilterConfig?.initialValue);

    const view = useMemo(() => new Routing(organismsConfig, getClientLogger), [organismsConfig]).getOrganismView(
        organismViewKey,
    );

    const routeToNewPage = () => {
        const lineageVariantFilter = lineageFilterConfig ? { [lineageKey]: lineage } : {};
        const cladeVariantFilter = cladeFilterConfig ? { [cladeKey]: clade } : {};
        const newPageState: BaselineAndVariantData = {
            ...pageState,
            baselineFilter: {
                location,
                dateRange,
            },
            variantFilter: {
                ...mutation,
                ...lineageVariantFilter,
                ...cladeVariantFilter,
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
                lineageFilterConfig={lineageFilterConfig}
                onLineageChange={setLineage}
                cladeFilterConfig={cladeFilterConfig}
                onCladeChange={setClade}
            />
            <ApplyFilterButton onClick={routeToNewPage} />
        </div>
    );
}
