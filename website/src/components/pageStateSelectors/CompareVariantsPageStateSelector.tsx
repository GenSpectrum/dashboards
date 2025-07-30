import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { makeVariantFilterConfig } from './VariantSelector.tsx';
import { VariantsSelector } from './VariantsSelector.tsx';
import { type OrganismsConfig } from '../../config.ts';
import { Inset } from '../../styles/Inset.tsx';
import type { CompareVariantsData, Id, VariantFilter } from '../../views/View.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import type { compareVariantsViewKey } from '../../views/viewKeys.ts';

export function CompareVariantsPageStateSelector({
    organismViewKey,
    organismsConfig,
    initialPageState,
}: {
    organismViewKey: OrganismViewKey & `${string}.${typeof compareVariantsViewKey}`;
    organismsConfig: OrganismsConfig;
    initialPageState: CompareVariantsData;
}) {
    const view = useMemo(() => new Routing(organismsConfig), [organismsConfig]).getOrganismView(organismViewKey);
    const [pageState, setPageState] = useState(initialPageState);

    const variantFilterConfigs = useMemo(() => {
        return new Map(
            pageState.variants.entries().map(([id]) => [id, makeVariantFilterConfig(view.organismConstants)]),
        );
    }, [pageState.variants, view.organismConstants]);

    const currentLapisFilter = useMemo(() => {
        return view.pageStateHandler.datasetFilterToLapisFilter(pageState.datasetFilter);
    }, [pageState, view.pageStateHandler]);

    return (
        <div className='flex flex-col gap-4'>
            <div>
                <SelectorHeadline>Filter dataset</SelectorHeadline>
                <Inset className='p-2'>
                    <BaselineSelector
                        baselineFilterConfigs={view.organismConstants.baselineFilterConfigs}
                        lapisFilter={currentLapisFilter}
                        datasetFilter={pageState.datasetFilter}
                        setDatasetFilter={(newDatasetFilter) => {
                            setPageState((previousState) => ({
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
