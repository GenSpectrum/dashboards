import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { type BaselineFilterConfig, BaselineSelector, type LocationFilterConfig } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { VariantsSelector } from './VariantsSelector.tsx';
import { type OrganismsConfig } from '../../config.ts';
import { Inset } from '../../styles/Inset.tsx';
import type { CompareVariantsData, DatasetFilter, Id } from '../../views/View.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import type { compareVariantsViewKey } from '../../views/viewKeys.ts';

export function CompareVariantsPageStateSelector({
    locationFilterConfig,
    organismViewKey,
    organismsConfig,
    pageState,
}: {
    locationFilterConfig: LocationFilterConfig;
    organismViewKey: OrganismViewKey & `${string}.${typeof compareVariantsViewKey}`;
    organismsConfig: OrganismsConfig;
    pageState: CompareVariantsData;
}) {
    const view = useMemo(() => new Routing(organismsConfig), [organismsConfig]).getOrganismView(organismViewKey);
    const variantFilterConfigs = useMemo(() => {
        return pageState.variants.values().map((variantFilter) => ({
            lineageFilterConfigs: view.organismConstants.lineageFilters,
            mutationFilterConfig: { enabled: true },
            isInVariantQueryMode: variantFilter.variantQuery !== undefined,
        }));
    }, [pageState.variants, view.organismConstants.lineageFilters]);
    const [currentPageState, setCurrentPageState] = useState(pageState);

    const currentLapisFilter = useMemo(() => {
        return view.pageStateHandler.datasetFilterToLapisFilter(currentPageState.datasetFilter);
    }, [currentPageState, view.pageStateHandler]);

    return (
        <div className='flex flex-col gap-4'>
            <div>
                <SelectorHeadline>Filter dataset</SelectorHeadline>
                <Inset className='p-2'>
                    <BaselineSelector
                        locationFilterConfig={locationFilterConfig}
                        baselineFilterConfigs={view.organismConstants.baselineFilterConfigs}
                        lapisFilter={currentLapisFilter}
                        datasetFilter={currentPageState.datasetFilter}
                        setDatasetFilter={(newDatasetFilter) => {
                            setCurrentPageState((previousState) => ({
                                ...previousState,
                                datasetFilter: newDatasetFilter,
                            }));
                        }}
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
            <div className='sticky bottom-0 w-full pb-5 backdrop-blur-sm'>
                <ApplyFilterButton
                    className='w-full'
                    pageStateHandler={view.pageStateHandler}
                    newPageState={currentPageState}
                />
            </div>
        </div>
    );
}
