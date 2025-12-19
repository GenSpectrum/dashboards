import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { makeVariantFilterConfig, VariantSelector } from './VariantSelector.tsx';
import { VariantsSelector } from './VariantsSelector.tsx';
import { Inset } from '../../styles/Inset.tsx';
import { GenericCompareToBaselineView } from '../../views/BaseView.ts';
import type { OrganismConstants } from '../../views/OrganismConstants.ts';
import type { CompareToBaselineData, Id, VariantFilter } from '../../views/View.ts';

export function CompareVariantsToBaselineStateSelector({
    view,
    pageState,
    setPageState,
    enableAdvancedQueryFilter,
}: {
    view: GenericCompareToBaselineView<OrganismConstants>;
    pageState: CompareToBaselineData;
    setPageState: Dispatch<SetStateAction<CompareToBaselineData>>;
    enableAdvancedQueryFilter: boolean;
}) {
    const [draftPageState, setDraftPageState] = useState(pageState);
    useEffect(() => setDraftPageState(pageState), [pageState]);

    const variantFilterConfig = useMemo(
        () => makeVariantFilterConfig(view.organismConstants),
        [view.organismConstants],
    );

    const variantFilterConfigs = useMemo(() => {
        return new Map(draftPageState.variants.entries().map(([id]) => [id, { ...variantFilterConfig }]));
    }, [draftPageState.variants, variantFilterConfig]);

    const currentLapisFilter = useMemo(() => {
        return view.pageStateHandler.baselineFilterToLapisFilter(draftPageState);
    }, [draftPageState, view.pageStateHandler]);

    return (
        <div className='flex flex-col gap-4'>
            <div>
                <SelectorHeadline>Filter dataset</SelectorHeadline>
                <Inset>
                    <div className='px-2'>
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
                    </div>
                </Inset>
            </div>
            <div>
                <SelectorHeadline>Baseline Filter</SelectorHeadline>
                <Inset className='p-2'>
                    <VariantSelector
                        onVariantFilterChange={(newVariantFilter) => {
                            setDraftPageState((previousState) => ({
                                ...previousState,
                                baselineFilter: newVariantFilter,
                            }));
                        }}
                        variantFilterConfig={variantFilterConfig}
                        variantFilter={draftPageState.baselineFilter}
                        lapisFilter={currentLapisFilter}
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
