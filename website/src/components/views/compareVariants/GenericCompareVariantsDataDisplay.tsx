import { type FC, useMemo } from 'react';

import { SelectVariants } from './SelectVariants.tsx';
import type { OrganismsConfig } from '../../../config.ts';
import { chooseGranularityBasedOnDateRange } from '../../../util/chooseGranularityBasedOnDateRange.ts';
import type { CompareVariantsData } from '../../../views/View.ts';
import { type OrganismWithViewKey, Routing } from '../../../views/routing.ts';
import { compareVariantsViewKey } from '../../../views/viewKeys.ts';
import { ComponentsGrid } from '../../ComponentsGrid.tsx';
import { GsMutationComparison } from '../../genspectrum/GsMutationComparison.tsx';
import { GsPrevalenceOverTime } from '../../genspectrum/GsPrevalenceOverTime.tsx';

export type GenericCompareVariantsDataDisplayProps = {
    organismViewKey: `${OrganismWithViewKey<typeof compareVariantsViewKey>}.${typeof compareVariantsViewKey}`;
    organismsConfig: OrganismsConfig;
    pageState: CompareVariantsData;
};

const componentHeight = '540px'; // prevalence over time table with 10 rows

export const GenericCompareVariantsDataDisplay: FC<GenericCompareVariantsDataDisplayProps> = ({
    organismViewKey,
    organismsConfig,
    pageState,
}) => {
    const view = useMemo(
        () => new Routing(organismsConfig).getOrganismView(organismViewKey),
        [organismsConfig, organismViewKey],
    );

    const datasetLapisFilter = view.pageStateHandler.datasetFilterToLapisFilter(pageState.datasetFilter);
    const timeGranularity = chooseGranularityBasedOnDateRange({
        earliestDate: new Date(view.organismConstants.earliestDate),
        dateRange: pageState.datasetFilter.dateFilters[view.organismConstants.mainDateField],
    });

    const numeratorLapisFilters = view.pageStateHandler.variantFiltersToNamedLapisFilters(pageState);

    const notEnoughVariantsSelected = pageState.variants.size < 2;

    return (
        <div className='mx-[8px] flex flex-col gap-y-6'>
            {notEnoughVariantsSelected ? (
                <SelectVariants />
            ) : (
                <ComponentsGrid>
                    <GsPrevalenceOverTime
                        numeratorFilters={numeratorLapisFilters}
                        denominatorFilter={datasetLapisFilter}
                        lapisDateField={view.organismConstants.mainDateField}
                        granularity={timeGranularity}
                        views={['line', 'table', 'bar', 'bubble']}
                        height={componentHeight}
                        pageSize={10}
                    />
                    <GsMutationComparison
                        lapisFilters={numeratorLapisFilters}
                        sequenceType='nucleotide'
                        height={componentHeight}
                        pageSize={10}
                    />
                    <GsMutationComparison
                        lapisFilters={numeratorLapisFilters}
                        sequenceType='amino acid'
                        height={componentHeight}
                        pageSize={10}
                    />
                </ComponentsGrid>
            )}
        </div>
    );
};
