import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector, type LocationFilterConfig } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { VariantSelector } from './VariantSelector.tsx';
import type { OrganismsConfig } from '../../config.ts';
import { Inset } from '../../styles/Inset.tsx';
import type { CompareSideBySideData } from '../../views/View.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import type { compareSideBySideViewKey } from '../../views/viewKeys.ts';

export function CompareSideBySidePageStateSelector({
    locationFilterConfig,
    filterId,
    pageState,
    organismViewKey,
    organismsConfig,
}: {
    locationFilterConfig: LocationFilterConfig;
    filterId: number;
    pageState: CompareSideBySideData;
    organismViewKey: OrganismViewKey & `${string}.${typeof compareSideBySideViewKey}`;
    organismsConfig: OrganismsConfig;
}) {
    const view = useMemo(() => new Routing(organismsConfig), [organismsConfig]).getOrganismView(organismViewKey);
    const variantFilterConfig = useMemo(
        () => ({
            lineageFilterConfigs: view.organismConstants.lineageFilters,
            mutationFilterConfig: { enabled: true },
            isInVariantQueryMode: pageState.filters.get(filterId)?.variantFilter.variantQuery !== undefined,
        }),
        [filterId, pageState.filters, view.organismConstants.lineageFilters],
    );
    const [currentPageState, setCurrentPageState] = useState(pageState);

    const { filterOfCurrentId, currentLapisFilter } = useMemo(() => {
        const filterOfCurrentId = currentPageState.filters.get(filterId) ?? {
            datasetFilter: {
                location: {},
                dateFilters: {},
                textFilters: {},
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
    }, [currentPageState, filterId, view.pageStateHandler]);

    return (
        <div className='flex flex-col gap-4 p-2 shadow-lg'>
            <div className='flex gap-8'>
                <div className='flex-0'>
                    <SelectorHeadline>Filter dataset</SelectorHeadline>
                    <Inset className='p-2'>
                        <BaselineSelector
                            locationFilterConfig={locationFilterConfig}
                            baselineFilterConfigs={view.organismConstants.baselineFilterConfigs}
                            lapisFilter={currentLapisFilter}
                            datasetFilter={filterOfCurrentId.datasetFilter}
                            setDatasetFilter={(newDatasetFilter) => {
                                setCurrentPageState((previousState) => {
                                    const updatedFilters = new Map(pageState.filters);
                                    updatedFilters.set(filterId, {
                                        ...filterOfCurrentId,
                                        datasetFilter: newDatasetFilter,
                                    });
                                    return { ...previousState, filters: updatedFilters };
                                });
                            }}
                        />
                    </Inset>
                </div>
                <div className='flex-grow'>
                    <SelectorHeadline>Variant Filter</SelectorHeadline>
                    <Inset className='p-2'>
                        <VariantSelector
                            onVariantFilterChange={(newVariantFilter) => {
                                setCurrentPageState((previousState) => {
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
                        />
                    </Inset>
                </div>
            </div>
            <div className='flex justify-end'>
                <ApplyFilterButton pageStateHandler={view.pageStateHandler} newPageState={currentPageState} />
            </div>
        </div>
    );
}
