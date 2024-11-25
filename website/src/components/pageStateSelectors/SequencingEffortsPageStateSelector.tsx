import type { DateRangeOption } from '@genspectrum/dashboard-components/util';
import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector, type DateRangeFilterConfig, type LocationFilterConfig } from './BaselineSelector.tsx';
import type { OrganismsConfig } from '../../config.ts';
import type { BaselineData } from '../../views/View.ts';
import type { LapisLocation } from '../../views/helpers.ts';
import { type OrganismViewKey, Routing, type sequencingEffortsViewKey } from '../../views/routing.ts';

export function SequencingEffortsPageStateSelector({
    locationFilterConfig,
    dateRangeFilterConfig,
    pageState,
    organismViewKey,
    organismsConfig,
}: {
    locationFilterConfig: LocationFilterConfig;
    dateRangeFilterConfig: DateRangeFilterConfig;
    pageState: BaselineData;
    organismViewKey: OrganismViewKey & `${string}.${typeof sequencingEffortsViewKey}`;
    organismsConfig: OrganismsConfig;
}) {
    const [location, setLocation] = useState<LapisLocation>(locationFilterConfig.initialLocation);
    const [dateRange, setDateRange] = useState<DateRangeOption>(dateRangeFilterConfig.initialDateRange);
    const view = useMemo(() => new Routing(organismsConfig), [organismsConfig]).getOrganismView(organismViewKey);

    const routeToNewPage = () => {
        const newPageState: BaselineData = {
            ...pageState,
            baselineFilter: {
                location,
                dateRange,
            },
        };

        window.location.href = view.pageStateHandler.toUrl(newPageState);
    };

    return (
        <div className='flex flex-col gap-6 bg-gray-50 p-2'>
            <BaselineSelector
                onLocationChange={(location) => setLocation(location)}
                locationFilterConfig={locationFilterConfig}
                onDateRangeChange={(dateRange) => setDateRange(dateRange)}
                dateRangeFilterConfig={dateRangeFilterConfig}
            />
            <ApplyFilterButton onClick={routeToNewPage} />
        </div>
    );
}
