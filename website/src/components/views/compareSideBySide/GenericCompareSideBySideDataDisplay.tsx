import { type FC } from 'react';

import { Organisms } from '../../../types/Organism.ts';
import { chooseGranularityBasedOnDateRange } from '../../../util/chooseGranularityBasedOnDateRange.ts';
import { BaseView } from '../../../views/BaseView.ts';
import { ComponentHeight, type OrganismConstants } from '../../../views/OrganismConstants.ts';
import type { CompareSideBySideData, DatasetAndVariantData } from '../../../views/View.ts';
import { CompareSideBySideStateHandler } from '../../../views/pageStateHandlers/CompareSideBySidePageStateHandler.ts';
import { toLapisFilterWithoutVariant } from '../../../views/pageStateHandlers/toLapisFilterWithoutVariant.ts';
import { GsAggregate } from '../../genspectrum/GsAggregate.tsx';
import { GsMutations } from '../../genspectrum/GsMutations.tsx';
import { GsPrevalenceOverTime } from '../../genspectrum/GsPrevalenceOverTime.tsx';
import { GsRelativeGrowthAdvantage } from '../../genspectrum/GsRelativeGrowthAdvantage.tsx';

export type GenericCompareSideBySideDataDisplayProps = {
    view: BaseView<CompareSideBySideData, OrganismConstants, CompareSideBySideStateHandler>;
    datasetAndVariantData: DatasetAndVariantData;
    hideMutationComponents?: boolean;
};

export const GenericCompareSideBySideDataDisplay: FC<GenericCompareSideBySideDataDisplayProps> = ({
    view,
    datasetAndVariantData,
    hideMutationComponents,
}) => {
    const { datasetFilter, variantFilter } = datasetAndVariantData;

    const datasetLapisFilter = toLapisFilterWithoutVariant(datasetFilter, view.organismConstants.additionalFilters);
    const timeGranularity = chooseGranularityBasedOnDateRange({
        earliestDate: new Date(view.organismConstants.earliestDate),
        dateRange: datasetFilter.dateFilters[view.organismConstants.mainDateField],
    });
    const numeratorFilter = view.pageStateHandler.variantFilterToLapisFilter(datasetFilter, variantFilter);

    return (
        <>
            <GsPrevalenceOverTime
                numeratorFilters={[
                    {
                        displayName: '',
                        lapisFilter: numeratorFilter,
                    },
                ]}
                denominatorFilter={datasetLapisFilter}
                lapisDateField={view.organismConstants.mainDateField}
                granularity={timeGranularity}
                height={ComponentHeight.large}
                pageSize={10}
            />
            {view.organismConstants.organism === Organisms.covid && (
                <GsRelativeGrowthAdvantage
                    numeratorFilter={numeratorFilter}
                    denominatorFilter={datasetLapisFilter}
                    lapisDateField={view.organismConstants.mainDateField}
                    height={ComponentHeight.large}
                />
            )}
            {hideMutationComponents !== true && (
                <>
                    <GsMutations
                        lapisFilter={numeratorFilter}
                        baselineLapisFilter={datasetLapisFilter}
                        sequenceType='nucleotide'
                        pageSize={10}
                    />
                    <GsMutations
                        lapisFilter={numeratorFilter}
                        baselineLapisFilter={datasetLapisFilter}
                        sequenceType='amino acid'
                        pageSize={10}
                    />
                </>
            )}

            {view.organismConstants.aggregatedVisualizations.compareSideBySide.map(({ label, fields, views }) => (
                <GsAggregate
                    key={label}
                    title={label}
                    fields={fields}
                    lapisFilter={numeratorFilter}
                    views={views}
                    pageSize={10}
                />
            ))}
        </>
    );
};
