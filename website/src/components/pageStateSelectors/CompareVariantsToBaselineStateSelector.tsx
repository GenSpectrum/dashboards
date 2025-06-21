import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector, makeBaselineFilterConfig } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { makeVariantFilterConfig, VariantSelector } from './VariantSelector.tsx';
import { VariantsSelector } from './VariantsSelector.tsx';
import { type OrganismsConfig } from '../../config.ts';
import { Inset } from '../../styles/Inset.tsx';
import type { CompareToBaselineData, Id, VariantFilter } from '../../views/View.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import { type compareToBaselineViewKey } from '../../views/viewKeys.ts';

export function CompareVariantsToBaselineStateSelector({
    organismViewKey,
    organismsConfig,
    initialPageState,
}: {
    organismViewKey: OrganismViewKey & `${string}.${typeof compareToBaselineViewKey}`;
    organismsConfig: OrganismsConfig;
    initialPageState: CompareToBaselineData;
}) {
    const view = useMemo(() => new Routing(organismsConfig), [organismsConfig]).getOrganismView(organismViewKey);
    const [pageState, setPageState] = useState(initialPageState);

    const variantFilterConfig = useMemo(
        () => makeVariantFilterConfig(view.organismConstants, { enableMutationFilter: true }),
        [view.organismConstants],
    );

    const variantFilterConfigs = useMemo(() => {
        return new Map(pageState.variants.entries().map(([id]) => [id, { ...variantFilterConfig }]));
    }, [pageState.variants, variantFilterConfig]);

    const baselineFilterConfigs = makeBaselineFilterConfig(view.organismConstants);

    const currentLapisFilter = useMemo(() => {
        return view.pageStateHandler.baselineFilterToLapisFilter(pageState);
    }, [pageState, view.pageStateHandler]);

    return (
        <div className='flex flex-col gap-4'>
            <div>
                <SelectorHeadline>Filter dataset</SelectorHeadline>
                <Inset>
                    <div className='px-2'>
                        <BaselineSelector
                            baselineFilterConfigs={baselineFilterConfigs}
                            lapisFilter={currentLapisFilter}
                            datasetFilter={pageState.datasetFilter}
                            setDatasetFilter={(newDatasetFilter) => {
                                setPageState((previousState) => ({
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
                            setPageState((previousState) => ({
                                ...previousState,
                                baselineFilter: newVariantFilter,
                            }));
                        }}
                        variantFilterConfig={variantFilterConfig}
                        variantFilter={pageState.baselineFilter}
                        lapisFilter={currentLapisFilter}
                    />
                </Inset>
            </div>

            <div>
                <SelectorHeadline>Variant Filters</SelectorHeadline>
                <Inset className='p-2'>
                    <VariantsSelector
                        variantFilters={pageState.variants}
                        variantFilterConfigs={variantFilterConfigs}
                        setVariantFilters={(newVariantFilters: Map<Id, VariantFilter>) => {
                            setPageState((previousState) => ({
                                ...previousState,
                                variants: newVariantFilters,
                            }));
                        }}
                        lapisFilter={currentLapisFilter}
                    />
                </Inset>
            </div>
            <div className='sticky bottom-0 w-full pb-5 backdrop-blur-xs'>
                <ApplyFilterButton
                    className='w-full'
                    pageStateHandler={view.pageStateHandler}
                    newPageState={pageState}
                />
            </div>
        </div>
    );
}
