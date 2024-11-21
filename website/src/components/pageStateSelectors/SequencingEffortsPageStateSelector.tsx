import type { DateRangeOption } from '@genspectrum/dashboard-components/util';
import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector, type DateRangeFilterConfig, type LocationFilterConfig } from './BaselineSelector.tsx';
import { getClientLogger } from '../../clientLogger.ts';
import type { OrganismsConfig } from '../../config.ts';
import type { BaselineData } from '../../views/View.ts';
import type { LapisLocation } from '../../views/helpers.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';

export function SequencingEffortsPageStateSelector({
    locationFilterConfig,
    daterRangeFilterConfig,
    pageState,
    organismViewKey,
    organismsConfig,
}: {
    locationFilterConfig: LocationFilterConfig;
    daterRangeFilterConfig: DateRangeFilterConfig;
    pageState: BaselineData;
    organismViewKey: OrganismViewKey;
    organismsConfig: OrganismsConfig;
}) {
    const [location, setLocation] = useState<LapisLocation>(locationFilterConfig.initialLocation);
    const [dateRange, setDateRange] = useState<DateRangeOption>(daterRangeFilterConfig.initialDateRange);
    const view = useMemo(() => new Routing(organismsConfig, getClientLogger), [organismsConfig]).getOrganismView(
        organismViewKey,
    );

    const routeToNewPage = () => {
        const newPageState: BaselineData = {
            ...pageState,
            baselineFilter: {
                location,
                dateRange,
            },
        };

        window.location.href = view.toUrl(newPageState);
    };

    return (
        <div className='flex flex-col gap-6 bg-gray-50 p-2'>
            <BaselineSelector
                onLocationChange={(location) => setLocation(location)}
                locationFilterConfig={locationFilterConfig}
                onDateRangeChange={(dateRange) => setDateRange(dateRange)}
                dateRangeFilterConfig={daterRangeFilterConfig}
            />
            <ApplyFilterButton onClick={routeToNewPage} />
        </div>
    );
}
