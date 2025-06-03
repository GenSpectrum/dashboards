import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector, makeBaselineFilterConfig } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { makeVariantFilterConfig, VariantSelector } from './VariantSelector.tsx';
import { type OrganismsConfig } from '../../config.ts';
import { Inset } from '../../styles/Inset.tsx';
import { type DatasetAndVariantData } from '../../views/View.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import type { singleVariantViewKey } from '../../views/viewKeys.ts';

export function SingleVariantPageStateSelector({
    organismViewKey,
    organismsConfig,
    initialPageState,
}: {
    organismViewKey: OrganismViewKey & `${string}.${typeof singleVariantViewKey}`;
    organismsConfig: OrganismsConfig;
    initialPageState: DatasetAndVariantData;
}) {
    const view = useMemo(() => new Routing(organismsConfig), [organismsConfig]).getOrganismView(organismViewKey);
    const variantFilterConfig = useMemo(
        () => makeVariantFilterConfig(view.organismConstants, { enableMutationFilter: true }),
        [view.organismConstants],
    );
    const [pageState, setPageState] = useState(initialPageState);

    const baselineFilterConfigs = makeBaselineFilterConfig(view.organismConstants);

    const currentLapisFilter = useMemo(() => {
        return view.pageStateHandler.toLapisFilter(pageState);
    }, [pageState, view.pageStateHandler]);

    return (
        <div className='flex flex-col gap-4'>
            <div>
                <SelectorHeadline>Filter dataset</SelectorHeadline>
                <Inset className={'p-2'}>
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
                </Inset>
            </div>

            <div>
                <SelectorHeadline>Variant Filter</SelectorHeadline>
                <Inset className={'p-2'}>
                    <VariantSelector
                        onVariantFilterChange={(newVariantFilter) => {
                            setPageState((previousState) => ({
                                ...previousState,
                                variantFilter: newVariantFilter,
                            }));
                        }}
                        variantFilterConfig={variantFilterConfig}
                        variantFilter={pageState.variantFilter}
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
