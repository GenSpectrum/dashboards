import { type FC, useMemo } from 'react';

import { CountStatistics } from './CountStatistics.tsx';
import { type OrganismsConfig } from '../../../config.ts';
import { chooseGranularityBasedOnDateRange } from '../../../util/chooseGranularityBasedOnDateRange.ts';
import type { CovidVariantData } from '../../../views/covid.ts';
import { getLocationDisplayConfig } from '../../../views/locationHelpers.ts';
import { locationFieldsToFilterIdentifier } from '../../../views/pageStateHandlers/locationFilterFromToUrl.ts';
import { type OrganismViewKey, Routing } from '../../../views/routing.ts';
import { sequencingEffortsViewKey } from '../../../views/viewKeys.ts';
import { ComponentsGrid } from '../../ComponentsGrid.tsx';
import { GsAggregate } from '../../genspectrum/GsAggregate.tsx';
import { GsNumberSequencesOverTime } from '../../genspectrum/GsNumberSequencesOverTime.tsx';
import { GsSequencesByLocation } from '../../genspectrum/GsSequencesByLocation.tsx';

export type GenericSequencingEffortsDataDisplayProps = {
    organismViewKey: OrganismViewKey & `${string}.${typeof sequencingEffortsViewKey}`;
    organismsConfig: OrganismsConfig;
    pageState: CovidVariantData;
};

export const GenericSequencingEffortsDataDisplay: FC<GenericSequencingEffortsDataDisplayProps> = ({
    organismViewKey,
    organismsConfig,
    pageState,
}) => {
    const view = useMemo(() => new Routing(organismsConfig), [organismsConfig]).getOrganismView(organismViewKey);

    const lapisFilter = view.pageStateHandler.toLapisFilter(pageState);
    const timeGranularity = chooseGranularityBasedOnDateRange({
        earliestDate: new Date(view.organismConstants.earliestDate),
        dateRange: pageState.datasetFilter.dateFilters[view.organismConstants.mainDateField],
    });

    const { locationField, mapName } = getLocationDisplayConfig(
        view.organismConstants.locationFields,
        pageState.datasetFilter.locationFilters[
            locationFieldsToFilterIdentifier(view.organismConstants.locationFields)
        ],
    );

    return (
        <div className='mx-2 flex flex-col gap-y-6'>
            <CountStatistics
                lapisFilter={lapisFilter}
                lapisUrl={organismsConfig[view.organismConstants.organism].lapis.url}
            />
            <ComponentsGrid>
                <GsNumberSequencesOverTime
                    lapisFilters={[
                        {
                            displayName: 'count',
                            lapisFilter: lapisFilter,
                        },
                    ]}
                    lapisDateField={view.organismConstants.mainDateField}
                    granularity={timeGranularity}
                    pageSize={10}
                />
                {locationField !== undefined && (
                    <GsSequencesByLocation
                        title='Sequences by location'
                        lapisLocationField={locationField}
                        lapisFilter={lapisFilter}
                        mapName={mapName}
                        pageSize={10}
                    />
                )}
                {view.organismConstants.aggregatedVisualizations.sequencingEfforts.map(({ label, fields, views }) => (
                    <GsAggregate
                        key={label}
                        title={label}
                        fields={fields}
                        lapisFilter={lapisFilter}
                        views={views}
                        pageSize={10}
                    />
                ))}
            </ComponentsGrid>
        </div>
    );
};
