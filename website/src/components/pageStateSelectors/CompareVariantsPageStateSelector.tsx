import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { makeVariantFilterConfig } from './VariantSelector.tsx';
import { VariantsSelector } from './VariantsSelector.tsx';
import { Inset } from '../../styles/Inset.tsx';
import { GenericCompareVariantsView } from '../../views/BaseView.ts';
import type { OrganismConstants } from '../../views/OrganismConstants.ts';
import type { CompareVariantsData, Id, VariantFilter } from '../../views/View.ts';

export function CompareVariantsPageStateSelector({
    view,
    pageState,
    setPageState,
    enableAdvancedQueryFilter,
}: {
    view: GenericCompareVariantsView<OrganismConstants>;
    pageState: CompareVariantsData;
    setPageState: Dispatch<SetStateAction<CompareVariantsData>>;
    enableAdvancedQueryFilter: boolean;
}) {
    const [draftPageState, setDraftPageState] = useState(pageState);
    useEffect(() => setDraftPageState(pageState), [pageState]);

    const variantFilterConfigs = useMemo(() => {
        return new Map(
            draftPageState.variants.entries().map(([id]) => [id, makeVariantFilterConfig(view.organismConstants)]),
        );
    }, [draftPageState.variants, view.organismConstants]);

    const currentLapisFilter = useMemo(() => {
        return view.pageStateHandler.datasetFilterToLapisFilter(draftPageState.datasetFilter);
    }, [draftPageState, view.pageStateHandler]);

    return (
        <div className='flex flex-col gap-4'>
            <div>
                <SelectorHeadline>Filter dataset</SelectorHeadline>
                <Inset className='p-2'>
                    <BaselineSelector
                        baselineFilterConfigs={view.organismConstants.baselineFilterConfigs}
                        lapisFilter={currentLapisFilter}
                        datasetFilter={draftPageState.datasetFilter}
                        setDatasetFilter={(newDatasetFilter) => {
                            setDraftPageState((previousState) => ({
                                ...previousState,
                                datasetFilter: newDatasetFilter,
                            }));
                        }}
                        enableAdvancedQueryFilter={enableAdvancedQueryFilter}
                    />
                </Inset>
            </div>
            <div>
                <SelectorHeadline>Variant Filters</SelectorHeadline>
                <Inset className='p-2'>
                    <VariantsSelector
                        variantFilters={draftPageState.variants}
                        variantFilterConfigs={variantFilterConfigs}
                        setVariantFilters={(newVariantFilters: Map<Id, VariantFilter>) => {
                            setDraftPageState((previousState) => ({
                                ...previousState,
                                variants: newVariantFilters,
                            }));
                        }}
                        lapisFilter={currentLapisFilter}
                        enableAdvancedQueryFilter={enableAdvancedQueryFilter}
                    />
                </Inset>
            </div>
            <div className='sticky bottom-0 w-full pb-5 backdrop-blur-xs'>
                <ApplyFilterButton
                    className='w-full'
                    pageStateHandler={view.pageStateHandler}
                    newPageState={draftPageState}
                    setPageState={setPageState}
                />
            </div>
        </div>
    );
}
