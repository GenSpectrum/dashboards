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
    columnIndex?: number;
};

export const GenericCompareSideBySideDataDisplay: FC<GenericCompareSideBySideDataDisplayProps> = ({
    view,
    datasetAndVariantData,
    hideMutationComponents,
    columnIndex = 0,
}) => {
    const { datasetFilter, variantFilter } = datasetAndVariantData;

    const datasetLapisFilter = toLapisFilterWithoutVariant(datasetFilter, view.organismConstants.additionalFilters);
    const timeGranularity = chooseGranularityBasedOnDateRange({
        earliestDate: new Date(view.organismConstants.earliestDate),
        dateRange: datasetFilter.dateFilters[view.organismConstants.mainDateField],
    });
    const numeratorFilter = view.pageStateHandler.variantFilterToLapisFilter(datasetFilter, variantFilter);

    // Fixed row indices - all columns use same row numbers, even if some rows are empty
    const rowPrevalence = 1;
    const rowGrowth = 2;
    const rowMutationsNucleotide = 3;
    const rowMutationsAminoAcid = 4;
    const rowAggregateStart = 5;

    return (
        <>
            {/* Row 1: Prevalence Over Time - always shown */}
            <div
                className='border-r-2 border-gray-200 px-2'
                style={{ gridColumn: columnIndex + 1, gridRow: rowPrevalence }}
            >
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
            </div>

            {/* Row 2: Relative Growth Advantage (COVID only) */}
            {view.organismConstants.organism === Organisms.covid && (
                <div
                    className='border-r-2 border-gray-200 px-2'
                    style={{ gridColumn: columnIndex + 1, gridRow: rowGrowth }}
                >
                    <GsRelativeGrowthAdvantage
                        numeratorFilter={numeratorFilter}
                        denominatorFilter={datasetLapisFilter}
                        lapisDateField={view.organismConstants.mainDateField}
                        height={ComponentHeight.large}
                    />
                </div>
            )}

            {/* Row 3 & 4: Mutations (if not hidden) */}
            {hideMutationComponents !== true && (
                <>
                    <div
                        className='border-r-2 border-gray-200 px-2'
                        style={{ gridColumn: columnIndex + 1, gridRow: rowMutationsNucleotide }}
                    >
                        <GsMutations
                            lapisFilter={numeratorFilter}
                            baselineLapisFilter={datasetLapisFilter}
                            sequenceType='nucleotide'
                            pageSize={10}
                        />
                    </div>
                    <div
                        className='border-r-2 border-gray-200 px-2'
                        style={{ gridColumn: columnIndex + 1, gridRow: rowMutationsAminoAcid }}
                    >
                        <GsMutations
                            lapisFilter={numeratorFilter}
                            baselineLapisFilter={datasetLapisFilter}
                            sequenceType='amino acid'
                            pageSize={10}
                        />
                    </div>
                </>
            )}

            {/* Remaining rows: Aggregated Visualizations */}
            {view.organismConstants.aggregatedVisualizations.compareSideBySide.map(({ label, fields, views }, index) => (
                <div
                    key={label}
                    className='border-r-2 border-gray-200 px-2'
                    style={{ gridColumn: columnIndex + 1, gridRow: rowAggregateStart + index }}
                >
                    <GsAggregate
                        title={label}
                        fields={fields}
                        lapisFilter={numeratorFilter}
                        views={views}
                        pageSize={10}
                    />
                </div>
            ))}
        </>
    );
};
