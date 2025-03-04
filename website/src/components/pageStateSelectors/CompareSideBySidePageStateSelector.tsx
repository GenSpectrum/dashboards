import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { type BaselineFilterConfig, BaselineSelector, type LocationFilterConfig } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { toVariantFilter, type VariantFilterConfig } from './VariantFilterConfig.ts';
import { VariantSelector } from './VariantSelector.tsx';
import type { OrganismsConfig } from '../../config.ts';
import { Inset } from '../../styles/Inset.tsx';
import type { CompareSideBySideData, DatasetFilter } from '../../views/View.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import type { compareSideBySideViewKey } from '../../views/viewKeys.ts';

export function CompareSideBySidePageStateSelector({
    locationFilterConfig,
    variantFilterConfig,
    filterId,
    pageState,
    organismViewKey,
    organismsConfig,
    baselineFilterConfigs,
    datasetFilter,
}: {
    locationFilterConfig: LocationFilterConfig;
    variantFilterConfig: VariantFilterConfig;
    filterId: number;
    pageState: CompareSideBySideData;
    organismViewKey: OrganismViewKey & `${string}.${typeof compareSideBySideViewKey}`;
    organismsConfig: OrganismsConfig;
    baselineFilterConfigs?: BaselineFilterConfig[];
    datasetFilter: DatasetFilter;
}) {
    const [datasetFilterState, setDatasetFilterState] = useState(datasetFilter);
    const [variantFilterConfigState, setVariantFilterConfigState] = useState<VariantFilterConfig>(variantFilterConfig);

    const view = useMemo(() => new Routing(organismsConfig), [organismsConfig]).getOrganismView(organismViewKey);

    const { newPageState, currentLapisFilter } = useMemo(() => {
        const filter = {
            datasetFilter: datasetFilterState,
            variantFilter: toVariantFilter(variantFilterConfigState),
        };
        const currentLapisFilter = view.pageStateHandler.variantFilterToLapisFilter(
            filter.datasetFilter,
            filter.variantFilter,
        );
        const updatedFilters = new Map(pageState.filters);
        updatedFilters.set(filterId, filter);
        return { newPageState: { filters: updatedFilters }, currentLapisFilter };
    }, [datasetFilterState, variantFilterConfigState, filterId, pageState, view.pageStateHandler]);

    return (
        <div className='flex flex-col gap-4 p-2 shadow-lg'>
            <div className='flex gap-8'>
                <div className='flex-0'>
                    <SelectorHeadline>Filter dataset</SelectorHeadline>
                    <Inset className='p-2'>
                        <BaselineSelector
                            locationFilterConfig={locationFilterConfig}
                            baselineFilterConfigs={baselineFilterConfigs}
                            lapisFilter={currentLapisFilter}
                            datasetFilter={datasetFilterState}
                            setDatasetFilter={setDatasetFilterState}
                        />
                    </Inset>
                </div>
                <div className='flex-grow'>
                    <SelectorHeadline>Variant Filter</SelectorHeadline>
                    <Inset className='p-2'>
                        <VariantSelector
                            onVariantFilterChange={(variantFilter) => setVariantFilterConfigState(variantFilter)}
                            variantFilterConfig={variantFilterConfigState}
                            lapisFilter={currentLapisFilter}
                        />
                    </Inset>
                </div>
            </div>
            <div className='flex justify-end'>
                <ApplyFilterButton pageStateHandler={view.pageStateHandler} newPageState={newPageState} />
            </div>
        </div>
    );
}
