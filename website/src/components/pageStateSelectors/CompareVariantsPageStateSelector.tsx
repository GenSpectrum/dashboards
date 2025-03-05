import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { type BaselineFilterConfig, BaselineSelector, type LocationFilterConfig } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { toVariantFilter, type VariantFilterConfig } from './VariantFilterConfig.ts';
import { VariantsSelector } from './VariantsSelector.tsx';
import { type OrganismsConfig } from '../../config.ts';
import { Inset } from '../../styles/Inset.tsx';
import type { DatasetFilter, Id } from '../../views/View.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import type { compareVariantsViewKey } from '../../views/viewKeys.ts';

export function CompareVariantsPageStateSelector({
    locationFilterConfig,
    variantFilterConfigs,
    organismViewKey,
    organismsConfig,
    baselineFilterConfigs,
    datasetFilter,
}: {
    locationFilterConfig: LocationFilterConfig;
    variantFilterConfigs: Map<Id, VariantFilterConfig>;
    organismViewKey: OrganismViewKey & `${string}.${typeof compareVariantsViewKey}`;
    organismsConfig: OrganismsConfig;
    baselineFilterConfigs?: BaselineFilterConfig[];
    datasetFilter: DatasetFilter;
}) {
    const [datasetFilterState, setDatasetFilterState] = useState(datasetFilter);

    const [variantConfigs, setVariantConfigs] = useState<Map<Id, VariantFilterConfig>>(variantFilterConfigs);

    const view = useMemo(
        () => new Routing(organismsConfig).getOrganismView(organismViewKey),
        [organismsConfig, organismViewKey],
    );

    const newPageState = useMemo(() => {
        const variants = new Map(
            Array.from(variantConfigs).map(([id, variantFilterConfig]) => {
                return [id, toVariantFilter(variantFilterConfig)];
            }),
        );

        return {
            datasetFilter: datasetFilterState,
            variants,
        };
    }, [datasetFilterState, variantConfigs]);

    const currentLapisFilter = useMemo(() => {
        return view.pageStateHandler.datasetFilterToLapisFilter(newPageState.datasetFilter);
    }, [newPageState, view.pageStateHandler]);

    return (
        <div className='flex flex-col gap-4'>
            <div>
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
            <div>
                <SelectorHeadline>Variant Filters</SelectorHeadline>
                <Inset className='p-2'>
                    <VariantsSelector
                        variantFilterConfigs={variantConfigs}
                        setVariantFilterConfigs={setVariantConfigs}
                        emptyVariantFilterConfigProvider={() => view.pageStateHandler.getEmptyVariantFilterConfig()}
                        lapisFilter={currentLapisFilter}
                    />
                </Inset>
            </div>
            <div className='sticky bottom-0 w-full pb-5 backdrop-blur-xs'>
                <ApplyFilterButton
                    className='w-full'
                    pageStateHandler={view.pageStateHandler}
                    newPageState={newPageState}
                />
            </div>
        </div>
    );
}
