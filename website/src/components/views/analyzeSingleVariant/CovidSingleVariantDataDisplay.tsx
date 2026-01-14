import { views } from '@genspectrum/dashboard-components/util';
import { type Dispatch, type FC, type SetStateAction } from 'react';

import { CollectionsList } from './CollectionsList.tsx';
import { SelectVariant } from './SelectVariant.tsx';
import { chooseGranularityBasedOnDateRange } from '../../../util/chooseGranularityBasedOnDateRange.ts';
import { hasOnlyUndefinedValues } from '../../../util/hasOnlyUndefinedValues.ts';
import { CovidAnalyzeSingleVariantView, type CovidVariantData } from '../../../views/covid.ts';
import { getLocationSubdivision } from '../../../views/locationHelpers.ts';
import { locationFieldsToFilterIdentifier } from '../../../views/pageStateHandlers/locationFilterFromToUrl.ts';
import { ComponentsGrid } from '../../ComponentsGrid.tsx';
import { GsAggregate } from '../../genspectrum/GsAggregate.tsx';
import { GsMutations } from '../../genspectrum/GsMutations.tsx';
import { GsMutationsOverTime } from '../../genspectrum/GsMutationsOverTime.tsx';
import { GsPrevalenceOverTime } from '../../genspectrum/GsPrevalenceOverTime.tsx';
import { GsRelativeGrowthAdvantage } from '../../genspectrum/GsRelativeGrowthAdvantage.tsx';
import { GsStatistics } from '../../genspectrum/GsStatistics.tsx';

export type CovidSingleVariantDataDisplayProps = {
    view: CovidAnalyzeSingleVariantView;
    pageState: CovidVariantData;
    setPageState: Dispatch<SetStateAction<CovidVariantData>>;
};

export const CovidSingleVariantDataDisplay: FC<CovidSingleVariantDataDisplayProps> = ({
    view,
    pageState,
    setPageState,
}) => {
    const variantFilter = view.pageStateHandler.toLapisFilter(pageState);
    const datasetLapisFilter = view.pageStateHandler.toLapisFilterWithoutVariant(pageState);
    const timeGranularity = chooseGranularityBasedOnDateRange({
        earliestDate: new Date(view.organismConstants.earliestDate),
        dateRange: pageState.datasetFilter.dateFilters[view.organismConstants.mainDateField],
    });
    const { label: subdivisionLabel, field: subdivisionField } = getLocationSubdivision(
        view.organismConstants.locationFields,
        pageState.datasetFilter.locationFilters[
            locationFieldsToFilterIdentifier(view.organismConstants.locationFields)
        ],
    );
    const noVariantSelected = hasOnlyUndefinedValues(pageState.variantFilter);

    return (
        <div className='mx-[8px] flex flex-col gap-y-6'>
            {noVariantSelected && (
                <SelectVariant>
                    <p className='mx-auto mt-4'>To get started you can choose a variant from one of our collections:</p>
                    <div className='max-w-md'>
                        <CollectionsList
                            initialCollectionId={pageState.collectionId}
                            pageState={pageState}
                            setPageState={setPageState}
                        />
                    </div>
                </SelectVariant>
            )}
            <GsStatistics numeratorFilter={variantFilter} denominatorFilter={datasetLapisFilter} />
            <ComponentsGrid>
                <GsPrevalenceOverTime
                    numeratorFilters={[
                        {
                            displayName: '',
                            lapisFilter: variantFilter,
                        },
                    ]}
                    denominatorFilter={datasetLapisFilter}
                    lapisDateField={view.organismConstants.mainDateField}
                    granularity={timeGranularity}
                    pageSize={10}
                />
                <GsRelativeGrowthAdvantage
                    numeratorFilter={variantFilter}
                    denominatorFilter={datasetLapisFilter}
                    lapisDateField={view.organismConstants.mainDateField}
                />
                <GsMutations
                    lapisFilter={variantFilter}
                    baselineLapisFilter={datasetLapisFilter}
                    sequenceType='nucleotide'
                    pageSize={10}
                />
                <GsMutations
                    lapisFilter={variantFilter}
                    baselineLapisFilter={datasetLapisFilter}
                    sequenceType='amino acid'
                    pageSize={10}
                />
                {subdivisionField !== undefined && (
                    <GsAggregate
                        title={subdivisionLabel}
                        fields={[subdivisionField]}
                        lapisFilter={variantFilter}
                        views={[views.table, views.bar]}
                        pageSize={10}
                    />
                )}

                {view.organismConstants.aggregatedVisualizations.singleVariant.map(({ label, fields, views }) => (
                    <GsAggregate
                        key={label}
                        title={label}
                        fields={fields}
                        lapisFilter={variantFilter}
                        views={views}
                        pageSize={10}
                    />
                ))}
            </ComponentsGrid>

            <GsMutationsOverTime
                lapisFilter={variantFilter}
                sequenceType='nucleotide'
                granularity={timeGranularity}
                lapisDateField={view.organismConstants.mainDateField}
                useNewEndpoint={true}
            />

            <GsMutationsOverTime
                lapisFilter={variantFilter}
                sequenceType='amino acid'
                granularity={timeGranularity}
                lapisDateField={view.organismConstants.mainDateField}
                useNewEndpoint={true}
            />
        </div>
    );
};
