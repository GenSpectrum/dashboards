import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { type BaselineFilterConfig, BaselineSelector, type LocationFilterConfig } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { toVariantFilter, type VariantFilterConfig } from './VariantFilterConfig.ts';
import { VariantSelector } from './VariantSelector.tsx';
import { type OrganismsConfig } from '../../config.ts';
import { Inset } from '../../styles/Inset.tsx';
import type { DatasetFilter } from '../../views/View.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import type { singleVariantViewKey } from '../../views/viewKeys.ts';

export function SingleVariantPageStateSelector({
    locationFilterConfig,
    variantFilterConfig,
    organismViewKey,
    organismsConfig,
    baselineFilterConfigs,
    datasetFilter,
}: {
    locationFilterConfig: LocationFilterConfig;
    variantFilterConfig: VariantFilterConfig;
    organismViewKey: OrganismViewKey & `${string}.${typeof singleVariantViewKey}`;
    organismsConfig: OrganismsConfig;
    baselineFilterConfigs?: BaselineFilterConfig[];
    datasetFilter: DatasetFilter;
}) {
    const [datasetFilterState, setDatasetFilterState] = useState(datasetFilter);

    const [variantFilterConfigState, setVariantFilterConfigState] = useState<VariantFilterConfig>(variantFilterConfig);

    const view = useMemo(() => new Routing(organismsConfig), [organismsConfig]).getOrganismView(organismViewKey);

    const newPageState = useMemo(() => {
        return {
            datasetFilter: datasetFilterState,
            variantFilter: toVariantFilter(variantFilterConfigState),
        };
    }, [variantFilterConfigState, datasetFilterState]);

    const currentLapisFilter = useMemo(() => {
        return view.pageStateHandler.toLapisFilter(newPageState);
    }, [newPageState]);

    return (
        <div className='flex flex-col gap-4'>
            <div>
                <SelectorHeadline>Filter dataset</SelectorHeadline>
                <Inset className={'p-2'}>
                    <BaselineSelector
                        locationFilterConfig={locationFilterConfig}
                        baselineFilterConfigs={baselineFilterConfigs}
                        lapisFilter={currentLapisFilter}
                        datasetFilter={datasetFilterState}
                        setDatasetFilter={setDatasetFilterState}
                    />
                </Inset>
            </div>

            <div>
                <SelectorHeadline>Variant Filter</SelectorHeadline>
                <Inset className={'p-2'}>
                    <VariantSelector
                        onVariantFilterChange={setVariantFilterConfigState}
                        variantFilterConfig={variantFilterConfigState}
                        lapisFilter={currentLapisFilter}
                    />
                </Inset>
            </div>

            <div className='sticky bottom-0 w-full pb-5 backdrop-blur-sm'>
                <ApplyFilterButton
                    className='w-full'
                    pageStateHandler={view.pageStateHandler}
                    newPageState={newPageState}
                />
            </div>
        </div>
    );
}
