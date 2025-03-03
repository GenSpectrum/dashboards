import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector, type LocationFilterConfig } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { VariantSelector } from './VariantSelector.tsx';
import { VariantsSelector } from './VariantsSelector.tsx';
import { type OrganismsConfig } from '../../config.ts';
import { Inset } from '../../styles/Inset.tsx';
import type { CompareToBaselineData, Id, VariantFilter } from '../../views/View.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import { type compareToBaselineViewKey } from '../../views/viewKeys.ts';

export function CompareVariantsToBaselineStateSelector({
    locationFilterConfig,
    organismViewKey,
    organismsConfig,
    pageState,
}: {
    locationFilterConfig: LocationFilterConfig;
    organismViewKey: OrganismViewKey & `${string}.${typeof compareToBaselineViewKey}`;
    organismsConfig: OrganismsConfig;
    pageState: CompareToBaselineData;
}) {
    const view = useMemo(() => new Routing(organismsConfig), [organismsConfig]).getOrganismView(organismViewKey);
    const [currentPageState, setCurrentPageState] = useState(pageState);

    const variantFilterConfig = useMemo(
        () => ({
            lineageFilterConfigs: view.organismConstants.lineageFilters,
            mutationFilterConfig: { enabled: true },
            variantQueryConfig: { enabled: view.organismConstants.useAdvancedQuery },
        }),
        [view.organismConstants],
    );

    const variantFilterConfigs = useMemo(() => {
        return new Map(currentPageState.variants.entries().map(([id]) => [id, { ...variantFilterConfig }]));
    }, [currentPageState.variants, variantFilterConfig]);

    const currentLapisFilter = useMemo(() => {
        return view.pageStateHandler.baselineFilterToLapisFilter(currentPageState);
    }, [currentPageState, view.pageStateHandler]);

    return (
        <div className='flex flex-col gap-4'>
            <div>
                <SelectorHeadline>Filter dataset</SelectorHeadline>
                <Inset>
                    <div className='px-2'>
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
                    </div>
                </Inset>
            </div>
            <div>
                <SelectorHeadline>Baseline Filter</SelectorHeadline>
                <Inset className='p-2'>
                    <VariantSelector
                        onVariantFilterChange={(newVariantFilter) => {
                            setCurrentPageState((previousState) => ({
                                ...previousState,
                                baselineFilter: newVariantFilter,
                            }));
                        }}
                        variantFilterConfig={variantFilterConfig}
                        variantFilter={currentPageState.baselineFilter}
                        lapisFilter={currentLapisFilter}
                    />
                </Inset>
            </div>

            <div>
                <SelectorHeadline>Variant Filters</SelectorHeadline>
                <Inset className='p-2'>
                    <VariantsSelector
                        variantFilters={currentPageState.variants}
                        variantFilterConfigs={variantFilterConfigs}
                        setVariantFilters={(newVariantFilters: Map<Id, VariantFilter>) => {
                            setCurrentPageState((previousState) => ({
                                ...previousState,
                                variants: newVariantFilters,
                            }));
                        }}
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
