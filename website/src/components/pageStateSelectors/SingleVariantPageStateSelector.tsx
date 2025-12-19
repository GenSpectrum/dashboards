import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector } from './BaselineSelector.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { makeVariantFilterConfig, VariantSelector } from './VariantSelector.tsx';
import { Inset } from '../../styles/Inset.tsx';
import type { GenericSingleVariantView } from '../../views/BaseView.ts';
import type { OrganismConstants } from '../../views/OrganismConstants.ts';
import { type DatasetAndVariantData } from '../../views/View.ts';

export function SingleVariantPageStateSelector({
    view,
    pageState,
    setPageState,
    enableAdvancedQueryFilter,
}: {
    view: GenericSingleVariantView<OrganismConstants>;
    pageState: DatasetAndVariantData;
    setPageState: Dispatch<SetStateAction<DatasetAndVariantData>>;
    enableAdvancedQueryFilter: boolean;
}) {
    const variantFilterConfig = useMemo(
        () => makeVariantFilterConfig(view.organismConstants),
        [view.organismConstants],
    );

    const [draftPageState, setDraftPageState] = useState(pageState);
    useEffect(() => setDraftPageState(pageState), [pageState]);

    const baselineFilterConfigs = view.organismConstants.baselineFilterConfigs;

    const currentLapisFilter = useMemo(() => {
        return view.pageStateHandler.toLapisFilter(draftPageState);
    }, [draftPageState, view.pageStateHandler]);

    return (
        <div className='flex flex-col gap-4'>
            <div>
                <SelectorHeadline>Filter dataset</SelectorHeadline>
                <Inset className={'p-2'}>
                    <BaselineSelector
                        baselineFilterConfigs={baselineFilterConfigs}
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
                <SelectorHeadline>Variant Filter</SelectorHeadline>
                <Inset className={'p-2'}>
                    <VariantSelector
                        onVariantFilterChange={(newVariantFilter) => {
                            setDraftPageState((previousState) => ({
                                ...previousState,
                                variantFilter: newVariantFilter,
                            }));
                        }}
                        variantFilterConfig={variantFilterConfig}
                        variantFilter={draftPageState.variantFilter}
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
