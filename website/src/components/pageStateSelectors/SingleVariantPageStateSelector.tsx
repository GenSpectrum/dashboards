import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector, type LocationFilterConfig } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { VariantSelector } from './VariantSelector.tsx';
import { type OrganismsConfig } from '../../config.ts';
import { Inset } from '../../styles/Inset.tsx';
import { type DatasetAndVariantData } from '../../views/View.ts';
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
    const variantFilterConfig = useMemo(
        () => ({
            lineageFilterConfigs: view.organismConstants.lineageFilters,
            mutationFilterConfig: { enabled: true },
            isInVariantQueryMode: pageState.variantFilter.variantQuery !== undefined,
        }),
        [pageState.variantFilter.variantQuery, view.organismConstants.lineageFilters],
    );
    const [currentPageState, setCurrentPageState] = useState(pageState);

    const baselineFilterConfigs = view.organismConstants.baselineFilterConfigs;

    const currentLapisFilter = useMemo(() => {
        return view.pageStateHandler.toLapisFilter(currentPageState);
    }, [currentPageState, view.pageStateHandler]);

    return (
        <div className='flex flex-col gap-4'>
            <div>
                <SelectorHeadline>Filter dataset</SelectorHeadline>
                <Inset className={'p-2'}>
                    <BaselineSelector
                        locationFilterConfig={locationFilterConfig}
                        baselineFilterConfigs={baselineFilterConfigs}
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
                <SelectorHeadline>Variant Filter</SelectorHeadline>
                <Inset className={'p-2'}>
                    <VariantSelector
                        onVariantFilterChange={(newVariantFilter) => {
                            setCurrentPageState((previousState) => ({
                                ...previousState,
                                variantFilter: newVariantFilter,
                            }));
                        }}
                        variantFilterConfig={variantFilterConfig}
                        variantFilter={currentPageState.variantFilter}
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
