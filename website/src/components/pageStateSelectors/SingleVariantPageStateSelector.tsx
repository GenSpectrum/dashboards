import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector, type LocationFilterConfig } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { toVariantFilter, type VariantFilterConfig } from './VariantFilterConfig.ts';
import { VariantSelector } from './VariantSelector.tsx';
import { type OrganismsConfig } from '../../config.ts';
import { Inset } from '../../styles/Inset.tsx';
import { type DatasetAndVariantData, getVariantFilterConfig } from '../../views/View.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import type { singleVariantViewKey } from '../../views/viewKeys.ts';

export function SingleVariantPageStateSelector({
    locationFilterConfig,
    organismViewKey,
    organismsConfig,
    pageState,
}: {
    locationFilterConfig: LocationFilterConfig;
    organismViewKey: OrganismViewKey & `${string}.${typeof singleVariantViewKey}`;
    organismsConfig: OrganismsConfig;
    pageState: DatasetAndVariantData;
}) {
    const view = useMemo(() => new Routing(organismsConfig), [organismsConfig]).getOrganismView(organismViewKey);
    const variantFilterConfig = useMemo(() => {
        return getVariantFilterConfig(
            view.organismConstants.lineageFilters,
            pageState.variantFilter,
            view.organismConstants.useAdvancedQuery,
        );
    }, [view, pageState]);

    const [datasetFilterState, setDatasetFilterState] = useState(pageState.datasetFilter);

    const [variantFilterConfigState, setVariantFilterConfigState] = useState<VariantFilterConfig>(variantFilterConfig);

    const baselineFilterConfigs = view.organismConstants.baselineFilterConfigs;

    const newPageState = useMemo(() => {
        return {
            ...pageState, // preserve additional fields, e.g. the covid collection id
            datasetFilter: datasetFilterState,
            variantFilter: toVariantFilter(variantFilterConfigState),
        };
    }, [pageState, variantFilterConfigState, datasetFilterState]);

    const currentLapisFilter = useMemo(() => {
        return view.pageStateHandler.toLapisFilter(newPageState);
    }, [newPageState, view.pageStateHandler]);

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
