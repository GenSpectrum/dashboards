import type { DateRangeOption } from '@genspectrum/dashboard-components/util';
import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector, type DateRangeFilterConfig, type LocationFilterConfig } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { toVariantFilter, type VariantFilterConfig } from './VariantFilterConfig.ts';
import { VariantSelector } from './VariantSelector.tsx';
import { type OrganismsConfig } from '../../config.ts';
import { type LapisLocation } from '../../views/helpers.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import type { singleVariantViewKey } from '../../views/viewKeys.ts';

export function SingleVariantPageStateSelector({
    locationFilterConfig,
    dateRangeFilterConfig,
    variantFilterConfig,
    organismViewKey,
    organismsConfig,
}: {
    locationFilterConfig: LocationFilterConfig;
    dateRangeFilterConfig: DateRangeFilterConfig;
    variantFilterConfig: VariantFilterConfig;
    organismViewKey: OrganismViewKey & `${string}.${typeof singleVariantViewKey}`;
    organismsConfig: OrganismsConfig;
}) {
    const [location, setLocation] = useState<LapisLocation>(locationFilterConfig.initialLocation);
    const [dateRange, setDateRange] = useState<DateRangeOption>(dateRangeFilterConfig.initialDateRange);

    const [variantFilterConfigState, setVariantFilterConfigState] = useState<VariantFilterConfig>(variantFilterConfig);

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
            <div>
                <div className='mb-2 flex justify-end gap-4 text-sm'>
                    <button className='flex items-center gap-1'>
                        <div className='iconify mdi--tooltip-help-outline'></div>
                        <div>Help</div>
                    </button>
                    <button className='flex items-center gap-1'>
                        <div className='iconify mdi--wrench'></div>
                        <div>Add filter fields</div>
                    </button>
                    <button className='flex items-center gap-1'>
                        <div className='iconify mdi--circle-arrows'></div>
                        <div>Reset</div>
                    </button>
                </div>
                <SelectorHeadline>
                    Filter dataset <span className='iconify text-sm mdi--information-outline'/>
                </SelectorHeadline>
                <BaselineSelector
                    onLocationChange={setLocation}
                    locationFilterConfig={locationFilterConfig}
                    onDateRangeChange={setDateRange}
                    dateRangeFilterConfig={dateRangeFilterConfig}
                />
            </div>
            <div>
                <SelectorHeadline>
                    Variant Filter <span className='iconify text-sm mdi--information-outline'/>
                </SelectorHeadline>
                <VariantSelector
                    onVariantFilterChange={setVariantFilterConfigState}
                    variantFilterConfig={variantFilterConfigState}
                />
            </div>
            <div className='mt-2'>
            <ApplyFilterButton pageStateHandler={view.pageStateHandler} newPageState={newPageState}/>
            </div>
        </div>
    );
}
