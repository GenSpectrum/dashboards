import { views } from '@genspectrum/dashboard-components/util';
import { type FC, useMemo } from 'react';

import { QuickstartLinks } from './QuickstartLinks.tsx';
import { SelectVariant } from './SelectVariant.tsx';
import type { OrganismsConfig } from '../../../config.ts';
import { Organisms } from '../../../types/Organism.ts';
import { chooseGranularityBasedOnDateRange } from '../../../util/chooseGranularityBasedOnDateRange.ts';
import { hasOnlyUndefinedValues } from '../../../util/hasOnlyUndefinedValues.ts';
import type { DatasetAndVariantData } from '../../../views/View.ts';
import { getLocationSubdivision } from '../../../views/locationHelpers.ts';
import { locationFieldsToFilterIdentifier } from '../../../views/pageStateHandlers/locationFilterFromToUrl.ts';
import { type OrganismViewKey, Routing, type SingleVariantOrganism } from '../../../views/routing.ts';
import type { singleVariantViewKey } from '../../../views/viewKeys.ts';
import { ComponentsGrid } from '../../ComponentsGrid.tsx';
import { GsAggregate } from '../../genspectrum/GsAggregate.tsx';
import { GsMutations } from '../../genspectrum/GsMutations.tsx';
import { GsMutationsOverTime } from '../../genspectrum/GsMutationsOverTime.tsx';
import { GsPrevalenceOverTime } from '../../genspectrum/GsPrevalenceOverTime.tsx';
import { GsStatistics } from '../../genspectrum/GsStatistics.tsx';

export type GenericAnalyseSingleVariantDataDisplayProps = {
    organismViewKey: OrganismViewKey &
        `${Exclude<SingleVariantOrganism, typeof Organisms.covid>}.${typeof singleVariantViewKey}`;
    organismsConfig: OrganismsConfig;
    pageState: DatasetAndVariantData;
};

export const GenericAnalyseSingleVariantDataDisplay: FC<GenericAnalyseSingleVariantDataDisplayProps> = ({
    organismViewKey,
    organismsConfig,
    pageState,
}) => {
    const view = useMemo(() => new Routing(organismsConfig), [organismsConfig]).getOrganismView(organismViewKey);

    const variantLapisFilter = view.pageStateHandler.toLapisFilter(pageState);
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
                    <QuickstartLinks view={view} datasetFilter={pageState.datasetFilter} />
                </SelectVariant>
            )}
            <GsStatistics numeratorFilter={variantLapisFilter} denominatorFilter={datasetLapisFilter} />
            <ComponentsGrid>
                <GsPrevalenceOverTime
                    numeratorFilters={[
                        {
                            displayName: '',
                            lapisFilter: variantLapisFilter,
                        },
                    ]}
                    denominatorFilter={datasetLapisFilter}
                    lapisDateField={view.organismConstants.mainDateField}
                    granularity={timeGranularity}
                    pageSize={10}
                />
                <GsMutations
                    lapisFilter={variantLapisFilter}
                    baselineLapisFilter={datasetLapisFilter}
                    sequenceType='nucleotide'
                    pageSize={10}
                />
                <GsMutations
                    lapisFilter={variantLapisFilter}
                    baselineLapisFilter={datasetLapisFilter}
                    sequenceType='amino acid'
                    pageSize={10}
                />
                {subdivisionField !== undefined && (
                    <GsAggregate
                        title={subdivisionLabel}
                        fields={[subdivisionField]}
                        lapisFilter={variantLapisFilter}
                        views={[views.table, views.bar]}
                        pageSize={10}
                    />
                )}

                {view.organismConstants.aggregatedVisualizations.singleVariant.map(({ label, fields, views }) => (
                    <GsAggregate
                        key={label}
                        title={label}
                        fields={fields}
                        lapisFilter={variantLapisFilter}
                        views={views}
                        pageSize={10}
                    />
                ))}
            </ComponentsGrid>
            <GsMutationsOverTime
                lapisFilter={variantLapisFilter}
                sequenceType='nucleotide'
                granularity={timeGranularity}
                lapisDateField={view.organismConstants.mainDateField}
            />
            <GsMutationsOverTime
                lapisFilter={variantLapisFilter}
                sequenceType='amino acid'
                granularity={timeGranularity}
                lapisDateField={view.organismConstants.mainDateField}
            />
        </div>
    );
};
