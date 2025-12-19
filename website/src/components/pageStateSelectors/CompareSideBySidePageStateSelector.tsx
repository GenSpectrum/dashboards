import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { makeVariantFilterConfig, VariantSelector } from './VariantSelector.tsx';
import { Inset } from '../../styles/Inset.tsx';
import { BaseView } from '../../views/BaseView.ts';
import type { OrganismConstants } from '../../views/OrganismConstants.ts';
import type { CompareSideBySideData } from '../../views/View.ts';
import { CompareSideBySideStateHandler } from '../../views/pageStateHandlers/CompareSideBySidePageStateHandler.ts';

export function CompareSideBySidePageStateSelector({
    view,
    filterId,
    pageState,
    setPageState,
    enableAdvancedQueryFilter,
}: {
    view: BaseView<CompareSideBySideData, OrganismConstants, CompareSideBySideStateHandler>;
    filterId: number;
    pageState: CompareSideBySideData;
    setPageState: Dispatch<SetStateAction<CompareSideBySideData>>;
    enableAdvancedQueryFilter: boolean;
}) {
    const [draftPageState, setDraftPageState] = useState(pageState);
    useEffect(() => setDraftPageState(pageState), [pageState]);

    const variantFilterConfig = useMemo(
        () => makeVariantFilterConfig(view.organismConstants),
        [view.organismConstants],
    );

    const { filterOfCurrentId, currentLapisFilter } = useMemo(() => {
        const filterOfCurrentId = draftPageState.filters.get(filterId) ?? {
            datasetFilter: {
                locationFilters: {},
                dateFilters: {},
                textFilters: {},
                numberFilters: {},
            },
            variantFilter: {},
        };
        return {
            filterOfCurrentId,
            currentLapisFilter: view.pageStateHandler.variantFilterToLapisFilter(
                filterOfCurrentId.datasetFilter,
                filterOfCurrentId.variantFilter,
            ),
        };
    }, [draftPageState, filterId, view.pageStateHandler]);

    return (
        <div className='flex flex-col gap-4 p-2 shadow-lg'>
            <div className='flex gap-4'>
                <div className='grow'>
                    <SelectorHeadline>Filter dataset</SelectorHeadline>
                    <Inset className='p-2'>
                        <BaselineSelector
                            baselineFilterConfigs={view.organismConstants.baselineFilterConfigs}
                            lapisFilter={currentLapisFilter}
                            datasetFilter={filterOfCurrentId.datasetFilter}
                            setDatasetFilter={(newDatasetFilter) => {
                                setDraftPageState((previousState) => {
                                    const updatedFilters = new Map(pageState.filters);
                                    updatedFilters.set(filterId, {
                                        ...filterOfCurrentId,
                                        datasetFilter: newDatasetFilter,
                                    });
                                    return { ...previousState, filters: updatedFilters };
                                });
                            }}
                            enableAdvancedQueryFilter={enableAdvancedQueryFilter}
                        />
                    </Inset>
                </div>
                <div className='grow'>
                    <SelectorHeadline>Variant Filter</SelectorHeadline>
                    <Inset className='p-2'>
                        <VariantSelector
                            onVariantFilterChange={(newVariantFilter) => {
                                setDraftPageState((previousState) => {
                                    const updatedFilters = new Map(pageState.filters);
                                    updatedFilters.set(filterId, {
                                        ...filterOfCurrentId,
                                        variantFilter: newVariantFilter,
                                    });
                                    return { ...previousState, filters: updatedFilters };
                                });
                            }}
                            variantFilterConfig={variantFilterConfig}
                            variantFilter={filterOfCurrentId.variantFilter}
                            lapisFilter={currentLapisFilter}
                            enableAdvancedQueryFilter={enableAdvancedQueryFilter}
                        />
                    </Inset>
                </div>
            </div>
            <div className='flex justify-end'>
                <ApplyFilterButton
                    pageStateHandler={view.pageStateHandler}
                    newPageState={draftPageState}
                    setPageState={setPageState}
                />
            </div>
        </div>
    );
}
