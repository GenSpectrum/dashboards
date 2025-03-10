import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { type BaselineFilterConfig, BaselineSelector, type LocationFilterConfig } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { toVariantFilter, type VariantFilterConfig } from './VariantFilterConfig.ts';
import { VariantSelector } from './VariantSelector.tsx';
import type { OrganismsConfig } from '../../config.ts';
import { Inset } from '../../styles/Inset.tsx';
import type { DatasetFilter } from '../../views/View.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import type { sequencingEffortsViewKey } from '../../views/viewKeys.ts';

export function SequencingEffortsPageStateSelector({
    locationFilterConfig,
    variantFilterConfig,
    organismViewKey,
    organismsConfig,
    baselineFilterConfigs,
    datasetFilter,
}: {
    locationFilterConfig: LocationFilterConfig;
    variantFilterConfig: VariantFilterConfig;
    organismViewKey: OrganismViewKey & `${string}.${typeof sequencingEffortsViewKey}`;
    organismsConfig: OrganismsConfig;
    baselineFilterConfigs?: BaselineFilterConfig[];
    datasetFilter: DatasetFilter;
}) {
    const [datasetFilterState, setDatasetFilterState] = useState(datasetFilter);

    const [variantFilterConfigState, setVariantFilterConfigState] = useState<VariantFilterConfig>(variantFilterConfig);

    const view = useMemo(() => new Routing(organismsConfig), [organismsConfig]).getOrganismView(organismViewKey);

    const newPageState = useMemo(
        () => ({
            datasetFilter: datasetFilterState,
            variantFilter: toVariantFilter(variantFilterConfigState),
        }),
        [datasetFilterState, variantFilterConfigState],
    );

    const currentLapisFilter = useMemo(() => {
        return view.pageStateHandler.toLapisFilter(newPageState);
    }, [newPageState, view.pageStateHandler]);

    return (
        <div className='flex flex-col gap-4'>
            <div>
                <SelectorHeadline>Filter dataset</SelectorHeadline>
                <Inset className='flex flex-col gap-6 p-2'>
                    <BaselineSelector
                        locationFilterConfig={locationFilterConfig}
                        baselineFilterConfigs={baselineFilterConfigs}
                        lapisFilter={currentLapisFilter}
                        datasetFilter={datasetFilterState}
                        setDatasetFilter={setDatasetFilterState}
                    />
                    <VariantSelector
                        onVariantFilterChange={setVariantFilterConfigState}
                        variantFilterConfig={{ ...variantFilterConfigState, mutationFilterConfig: undefined }}
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
