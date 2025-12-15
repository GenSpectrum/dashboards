import { type FC, useMemo } from 'react';

import { SelectBaseline } from './SelectBaseline.tsx';
import type { OrganismsConfig } from '../../../config.ts';
import { chooseGranularityBasedOnDateRange } from '../../../util/chooseGranularityBasedOnDateRange.ts';
import { ComponentHeight } from '../../../views/OrganismConstants.ts';
import type { CompareToBaselineData } from '../../../views/View.ts';
import { type OrganismWithViewKey, Routing } from '../../../views/routing.ts';
import { compareToBaselineViewKey } from '../../../views/viewKeys.ts';
import { ComponentsGrid } from '../../ComponentsGrid.tsx';
import { GsPrevalenceOverTime } from '../../genspectrum/GsPrevalenceOverTime.tsx';

export type GenericCompareToBaselineDisplayProps = {
    organismViewKey: `${OrganismWithViewKey<typeof compareToBaselineViewKey>}.${typeof compareToBaselineViewKey}`;
    organismsConfig: OrganismsConfig;
    pageState: CompareToBaselineData;
};

export const GenericCompareToBaselineDataDisplay: FC<GenericCompareToBaselineDisplayProps> = ({
    organismViewKey,
    organismsConfig,
    pageState,
}) => {
    const view = useMemo(
        () => new Routing(organismsConfig).getOrganismView(organismViewKey),
        [organismsConfig, organismViewKey],
    );

    const baselineLapisFilter = view.pageStateHandler.baselineFilterToLapisFilter(pageState);
    const timeGranularity = chooseGranularityBasedOnDateRange({
        earliestDate: new Date(view.organismConstants.earliestDate),
        dateRange: pageState.datasetFilter.dateFilters[view.organismConstants.mainDateField],
    });

    const numeratorLapisFilters = view.pageStateHandler.variantFiltersToNamedLapisFilters(pageState);
    const noVariantSelected = pageState.variants.size < 1;

    return noVariantSelected ? (
        <SelectBaseline />
    ) : (
        <ComponentsGrid>
            <GsPrevalenceOverTime
                numeratorFilters={numeratorLapisFilters}
                denominatorFilter={baselineLapisFilter}
                lapisDateField={view.organismConstants.mainDateField}
                granularity={timeGranularity}
                views={['line', 'table', 'bar']}
                height={ComponentHeight.large}
                pageSize={12}
            />
        </ComponentsGrid>
    );
};
