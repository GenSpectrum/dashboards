import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { makeVariantFilterConfig, VariantSelector } from './VariantSelector.tsx';
import type { OrganismsConfig } from '../../config.ts';
import { Inset } from '../../styles/Inset.tsx';
import type { CompareSideBySideData } from '../../views/View.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import type { compareSideBySideViewKey } from '../../views/viewKeys.ts';

export function CompareSideBySidePageStateSelector({
    filterId,
    initialPageState,
    organismViewKey,
    organismsConfig,
    enableAdvancedQueryFilter,
}: {
    filterId: number;
    initialPageState: CompareSideBySideData;
    organismViewKey: OrganismViewKey & `${string}.${typeof compareSideBySideViewKey}`;
    organismsConfig: OrganismsConfig;
    enableAdvancedQueryFilter: boolean;
}) {
    const view = useMemo(() => new Routing(organismsConfig), [organismsConfig]).getOrganismView(organismViewKey);
    const variantFilterConfig = useMemo(
        () => makeVariantFilterConfig(view.organismConstants),
        [view.organismConstants],
    );
    const [pageState, setPageState] = useState(initialPageState);

    const { filterOfCurrentId, currentLapisFilter } = useMemo(() => {
        const filterOfCurrentId = pageState.filters.get(filterId) ?? {
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
    }, [pageState, filterId, view.pageStateHandler]);

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
                                setPageState((previousState) => {
                                    const updatedFilters = new Map(initialPageState.filters);
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
                                setPageState((previousState) => {
                                    const updatedFilters = new Map(initialPageState.filters);
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
                <ApplyFilterButton pageStateHandler={view.pageStateHandler} newPageState={pageState} />
            </div>
        </div>
    );
}
