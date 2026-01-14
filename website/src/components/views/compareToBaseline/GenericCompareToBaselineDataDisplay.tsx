import { type FC } from 'react';

import { SelectBaseline } from './SelectBaseline.tsx';
import { chooseGranularityBasedOnDateRange } from '../../../util/chooseGranularityBasedOnDateRange.ts';
import { GenericCompareToBaselineView } from '../../../views/BaseView.ts';
import { ComponentHeight, type OrganismConstants } from '../../../views/OrganismConstants.ts';
import type { CompareToBaselineData } from '../../../views/View.ts';
import { ComponentsGrid } from '../../ComponentsGrid.tsx';
import { GsPrevalenceOverTime } from '../../genspectrum/GsPrevalenceOverTime.tsx';

export type GenericCompareToBaselineDisplayProps = {
    view: GenericCompareToBaselineView<OrganismConstants>;
    pageState: CompareToBaselineData;
};

export const GenericCompareToBaselineDataDisplay: FC<GenericCompareToBaselineDisplayProps> = ({ view, pageState }) => {
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
