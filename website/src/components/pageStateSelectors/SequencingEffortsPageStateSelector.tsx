import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector } from './BaselineSelector.tsx';
import { LineageFilterInput } from './LineageFilterInput.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { Inset } from '../../styles/Inset.tsx';
import { GenericSequencingEffortsView } from '../../views/BaseView.ts';
import type { OrganismConstants } from '../../views/OrganismConstants.ts';
import type { DatasetAndVariantData } from '../../views/View.ts';

export function SequencingEffortsPageStateSelector({
    view,
    pageState,
    setPageState,
    enableAdvancedQueryFilter,
}: {
    view: GenericSequencingEffortsView<OrganismConstants>;
    pageState: DatasetAndVariantData;
    setPageState: Dispatch<SetStateAction<DatasetAndVariantData>>;
    enableAdvancedQueryFilter: boolean;
}) {
    const [draftPageState, setDraftPageState] = useState(pageState);
    useEffect(() => setDraftPageState(pageState), [pageState]);

    const currentLapisFilter = useMemo(() => {
        return view.pageStateHandler.toLapisFilter(draftPageState);
    }, [draftPageState, view.pageStateHandler]);

    return (
        <div className='flex flex-col gap-4'>
            <div>
                <SelectorHeadline>Filter dataset</SelectorHeadline>
                <Inset className='flex flex-col gap-2 p-2'>
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
                    {view.organismConstants.lineageFilters.map((lineageFilterConfig) => (
                        <LineageFilterInput
                            lineageFilterConfig={lineageFilterConfig}
                            onLineageChange={(lineage) => {
                                setDraftPageState((previousState) => ({
                                    ...previousState,
                                    variantFilter: {
                                        lineages: {
                                            ...previousState.variantFilter.lineages,
                                            [lineageFilterConfig.lapisField]: lineage,
                                        },
                                    },
                                }));
                            }}
                            key={lineageFilterConfig.lapisField}
                            lapisFilter={currentLapisFilter}
                            value={draftPageState.variantFilter.lineages?.[lineageFilterConfig.lapisField]}
                        />
                    ))}
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
