import { useMemo, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton.tsx';
import { BaselineSelector } from './BaselineSelector.tsx';
import { LineageFilterInput } from './LineageFilterInput.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import type { OrganismsConfig } from '../../config.ts';
import { Inset } from '../../styles/Inset.tsx';
import type { DatasetAndVariantData } from '../../views/View.ts';
import { type OrganismViewKey, Routing } from '../../views/routing.ts';
import type { sequencingEffortsViewKey } from '../../views/viewKeys.ts';

export function SequencingEffortsPageStateSelector({
    organismViewKey,
    organismsConfig,
    initialPageState,
}: {
    organismViewKey: OrganismViewKey & `${string}.${typeof sequencingEffortsViewKey}`;
    organismsConfig: OrganismsConfig;
    initialPageState: DatasetAndVariantData;
}) {
    const view = useMemo(() => new Routing(organismsConfig), [organismsConfig]).getOrganismView(organismViewKey);

    const [pageState, setPageState] = useState(initialPageState);

    const currentLapisFilter = useMemo(() => {
        return view.pageStateHandler.toLapisFilter(pageState);
    }, [pageState, view.pageStateHandler]);

    return (
        <div className='flex flex-col gap-4'>
            <div>
                <SelectorHeadline>Filter dataset</SelectorHeadline>
                <Inset className='flex flex-col gap-2 p-2'>
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
                    {view.organismConstants.lineageFilters.map((lineageFilterConfig) => (
                        <LineageFilterInput
                            lineageFilterConfig={lineageFilterConfig}
                            onLineageChange={(lineage) => {
                                setPageState((previousState) => ({
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
                            value={pageState.variantFilter.lineages?.[lineageFilterConfig.lapisField]}
                        />
                    ))}
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
