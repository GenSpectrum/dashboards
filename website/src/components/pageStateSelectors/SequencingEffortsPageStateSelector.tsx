import type { DateRangeOption } from '@genspectrum/dashboard-components/util';
import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector, type DateRangeFilterConfig, type LocationFilterConfig } from './BaselineSelector.tsx';
import type { OrganismsConfig } from '../../config.ts';
import type { LapisLocation } from '../../views/helpers.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import type { sequencingEffortsViewKey } from '../../views/viewKeys.ts';

export function SequencingEffortsPageStateSelector({
    locationFilterConfig,
    dateRangeFilterConfig,
    organismViewKey,
    organismsConfig,
}: {
    locationFilterConfig: LocationFilterConfig;
    dateRangeFilterConfig: DateRangeFilterConfig;
    organismViewKey: OrganismViewKey & `${string}.${typeof sequencingEffortsViewKey}`;
    organismsConfig: OrganismsConfig;
}) {
    const [location, setLocation] = useState<LapisLocation>(locationFilterConfig.initialLocation);
    const [dateRange, setDateRange] = useState<DateRangeOption>(dateRangeFilterConfig.initialDateRange);
    const view = useMemo(() => new Routing(organismsConfig), [organismsConfig]).getOrganismView(organismViewKey);

    const newPageState = useMemo(
        () => ({
            baselineFilter: {
                location,
                dateRange,
            },
        }),
        [location, dateRange],
    );

    return (
        <div className='flex flex-col gap-6 bg-gray-50 p-2'>
            <BaselineSelector
                onLocationChange={(location) => setLocation(location)}
                locationFilterConfig={locationFilterConfig}
                onDateRangeChange={(dateRange) => setDateRange(dateRange)}
                dateRangeFilterConfig={dateRangeFilterConfig}
            />
            <ApplyFilterButton pageStateHandler={view.pageStateHandler} newPageState={newPageState} />
        </div>
    );
}
