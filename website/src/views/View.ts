import type { DateRangeOption } from '@genspectrum/dashboard-components/util';

import type { OrganismConstants } from './OrganismConstants.ts';
import { type ViewConstants } from './ViewConstants';
import type { LapisLineageQuery, LapisLocation, LapisMutationQuery } from './helpers.ts';
import { type PageStateHandler } from './pageStateHandlers/PageStateHandler.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import type { VariantFilterConfig } from '../components/pageStateSelectors/VariantFilterConfig.ts';
import { type BreadcrumbElement } from '../layouts/Breadcrumbs.tsx';

export type DatasetFilter = {
    location: LapisLocation;
    dateRange: DateRangeOption;
};

export type Dataset = {
    datasetFilter: DatasetFilter;
};

export type VariantFilter = {
    mutations?: LapisMutationQuery;
    lineages?: LapisLineageQuery;
    variantQuery?: string;
};

export type VariantData<VariantFilterType = VariantFilter> = {
    variantFilter: VariantFilterType;
};

export type BaselineData = {
    baselineFilter: VariantFilter;
};

export type DatasetAndVariantData = Dataset & VariantData;

export type Id = number;

export type CompareSideBySideData<ColumnData extends DatasetAndVariantData = DatasetAndVariantData> = {
    filters: Map<Id, ColumnData>;
};

export type CompareVariantsData = {
    variants: Map<Id, VariantFilter>;
} & Dataset;

export type CompareToBaselineData = {
    variants: Map<Id, VariantFilter>;
} & Dataset &
    BaselineData;

/**
 * PageState is the state of the organism pages. It:
 * - can be set by users via input components
 * - is used to compute LAPIS filters for the visualization components
 * - is stored in the URL as query parameters
 * - must be parsable from the URL query parameters
 */
export type View<
    PageState extends object,
    Constants extends OrganismConstants,
    StateHandler extends PageStateHandler<PageState>,
> = {
    readonly viewConstants: ViewConstants;
    readonly organismConstants: Constants;
    readonly pageStateHandler: StateHandler;

    readonly viewTitle: string;
    readonly viewBreadcrumbEntries: BreadcrumbElement[];
};

export const defaultTablePageSize = 200;

export const pathoplexusGroupNameField = 'groupName';

export function getLineageFilterFields(lineageFilters: LineageFilterConfig[]) {
    return lineageFilters.map((filter) => filter.lapisField);
}

export function getVariantFilterConfig(
    lineageFilterConfigs: LineageFilterConfig[],
    variantFilter: VariantFilter,
    useAdvancedQuery: boolean,
    hideMutationFilter?: boolean,
): VariantFilterConfig {
    const mutationFilterConfig = hideMutationFilter ? undefined : (variantFilter.mutations ?? {});

    return {
        variantQueryConfig: variantFilter.variantQuery,
        mutationFilterConfig,
        lineageFilterConfigs: getLineageFilterConfigs(lineageFilterConfigs, variantFilter.lineages),
        isInVariantQueryMode: useAdvancedQuery ? variantFilter.variantQuery !== undefined : undefined,
    };
}

export function getLineageFilterConfigs(
    lineageFilterConfigs: LineageFilterConfig[],
    lineages?: LapisLineageQuery,
): LineageFilterConfig[] {
    return lineageFilterConfigs.map((config) => {
        return {
            ...config,
            initialValue: (lineages ? lineages[config.lapisField] : undefined) ?? config.initialValue,
        };
    });
}
