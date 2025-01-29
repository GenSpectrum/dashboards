import type { DateRangeOption } from '@genspectrum/dashboard-components/util';
import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector, type DateRangeFilterConfig, type LocationFilterConfig } from './BaselineSelector.tsx';
import { ButtonWithIcon } from './ButtonWithIcon.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { toVariantFilter, type VariantFilterConfig } from './VariantFilterConfig.ts';
import { VariantSelector } from './VariantSelector.tsx';
import type { OrganismsConfig } from '../../config.ts';
import { Inset } from '../../styles/Inset.tsx';
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

    return (
        <div>
            <div className='mb-2 flex justify-end gap-4 text-sm'>
                <ButtonWithIcon icon={'mdi--tooltip-help-outline'}>
                    <div>Help</div>
                </ButtonWithIcon>
                <ButtonWithIcon icon={'mdi--wrench'}>
                    <div>Add filter fields</div>
                </ButtonWithIcon>
                <ButtonWithIcon icon={'mdi--circle-arrows'}>
                    <div>Reset</div>
                </ButtonWithIcon>
            </div>
            <hr className='my-2 border-gray-200' />

            <SelectorHeadline>Filter dataset</SelectorHeadline>
            <Inset className='flex flex-col gap-6 p-2'>
                <BaselineSelector
                    onLocationChange={(location) => setLocation(location)}
                    locationFilterConfig={locationFilterConfig}
                    onDateRangeChange={(dateRange) => setDateRange(dateRange)}
                    dateRangeFilterConfig={dateRangeFilterConfig}
                />
                <VariantSelector
                    onVariantFilterChange={setVariantFilterConfigState}
                    variantFilterConfig={{ ...variantFilterConfigState, mutationFilterConfig: undefined }}
                />
            </Inset>
            <ApplyFilterButton
                className={'mt-4'}
                pageStateHandler={view.pageStateHandler}
                newPageState={newPageState}
            />
        </div>
    );
}
