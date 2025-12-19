import { type FC, useMemo } from 'react';

import type { OrganismsConfig } from '../../../config.ts';
import { Organisms } from '../../../types/Organism.ts';
import { chooseGranularityBasedOnDateRange } from '../../../util/chooseGranularityBasedOnDateRange.ts';
import { ComponentHeight } from '../../../views/OrganismConstants.ts';
import type { DatasetAndVariantData } from '../../../views/View.ts';
import { toLapisFilterWithoutVariant } from '../../../views/pageStateHandlers/toLapisFilterWithoutVariant.ts';
import { type OrganismWithViewKey, Routing } from '../../../views/routing.ts';
import { compareSideBySideViewKey } from '../../../views/viewKeys.ts';
import { GsAggregate } from '../../genspectrum/GsAggregate.tsx';
import { GsMutations } from '../../genspectrum/GsMutations.tsx';
import { GsPrevalenceOverTime } from '../../genspectrum/GsPrevalenceOverTime.tsx';
import { GsRelativeGrowthAdvantage } from '../../genspectrum/GsRelativeGrowthAdvantage.tsx';

export type GenericCompareSideBySideDataDisplayProps = {
    organismViewKey: `${OrganismWithViewKey<typeof compareSideBySideViewKey>}.${typeof compareSideBySideViewKey}`;
    organismsConfig: OrganismsConfig;
    datasetAndVariantData: DatasetAndVariantData;
    hideMutationComponents?: boolean;
};

export const GenericCompareSideBySideDataDisplay: FC<GenericCompareSideBySideDataDisplayProps> = ({
    organismViewKey,
    organismsConfig,
    datasetAndVariantData,
    hideMutationComponents,
}) => {
    const view = useMemo(
        () => new Routing(organismsConfig).getOrganismView(organismViewKey),
        [organismsConfig, organismViewKey],
    );

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
