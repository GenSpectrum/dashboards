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
import {GsTextInput} from "../genspectrum/GsTextInput.tsx";

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

    const [advancedQuery, setAdvancedQuery] = useState(false);

    return (
        <div className='flex flex-col gap-6'>
            <div>
                <SelectorHeadline>Filter dataset</SelectorHeadline>
                <BaselineSelector
                    onLocationChange={setLocation}
                    locationFilterConfig={locationFilterConfig}
                    onDateRangeChange={setDateRange}
                    dateRangeFilterConfig={dateRangeFilterConfig}
                />
            </div>
            <div>
                <div className='flex justify-between'>
                    <SelectorHeadline>Variant Filter</SelectorHeadline>
                    <div className='flex items-center gap-1 text-sm'>
                        <span>Advanced</span>
                        <input
                            type='checkbox'
                            className='checkbox checkbox-xs peer'
                            onInput={() => setAdvancedQuery(!advancedQuery)}
                        />
                    </div>
                </div>
                {advancedQuery? (
                    <GsTextInput placeholderText={"Advanced query: A123T & ins_123:TA"} lapisField={"variantQuery"}></GsTextInput>
                ) :
                    (<VariantSelector
                        onVariantFilterChange={setVariantFilterConfigState}
                        variantFilterConfig={variantFilterConfigState}
                    />)
                }


            </div>
            <ApplyFilterButton pageStateHandler={view.pageStateHandler} newPageState={newPageState} />
        </div>
    );
}
