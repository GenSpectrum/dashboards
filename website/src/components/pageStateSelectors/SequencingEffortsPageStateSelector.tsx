import type { DateRangeOption } from '@genspectrum/dashboard-components/util';
import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector, type DateRangeFilterConfig, type LocationFilterConfig } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { toVariantFilter, type VariantFilterConfig } from './VariantFilterConfig.ts';
import { VariantSelector } from './VariantSelector.tsx';
import type { OrganismsConfig } from '../../config.ts';
import type { LapisLocation } from '../../views/helpers.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import type { sequencingEffortsViewKey } from '../../views/viewKeys.ts';

export function SequencingEffortsPageStateSelector({
    locationFilterConfig,
    dateRangeFilterConfig,
    variantFilterConfig,
    organismViewKey,
    organismsConfig,
}: {
    locationFilterConfig: LocationFilterConfig;
    dateRangeFilterConfig: DateRangeFilterConfig;
    variantFilterConfig: VariantFilterConfig;
    organismViewKey: OrganismViewKey & `${string}.${typeof sequencingEffortsViewKey}`;
    organismsConfig: OrganismsConfig;
}) {
    const [location, setLocation] = useState<LapisLocation>(locationFilterConfig.initialLocation);
    const [variantFilterConfigState, setVariantFilterConfigState] = useState<VariantFilterConfig>(variantFilterConfig);
    const [dateRange, setDateRange] = useState<DateRangeOption>(dateRangeFilterConfig.initialDateRange);

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

    const currentLapisFilter = useMemo(() => {
        return view.pageStateHandler.toLapisFilter(newPageState);
    }, [newPageState]);

    return (
        <div className='flex flex-col gap-6'>
            <div>
                <SelectorHeadline>Filter dataset</SelectorHeadline>
                <BaselineSelector
                    onLocationChange={(location) => setLocation(location)}
                    locationFilterConfig={{ ...locationFilterConfig, initialLocation: location }}
                    onDateRangeChange={(dateRange) => setDateRange(dateRange)}
                    dateRangeFilterConfig={dateRangeFilterConfig}
                    lapisFilter={currentLapisFilter}
                />
            </div>
            <div>
                <VariantSelector
                    onVariantFilterChange={setVariantFilterConfigState}
                    variantFilterConfig={{ ...variantFilterConfigState, mutationFilterConfig: undefined }}
                    lapisFilter={currentLapisFilter}
                />
            </div>
            <ApplyFilterButton pageStateHandler={view.pageStateHandler} newPageState={newPageState} />
        </div>
    );
}
