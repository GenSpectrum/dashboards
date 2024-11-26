import type { DateRangeOption } from '@genspectrum/dashboard-components/util';

import type { OrganismConstants } from './OrganismConstants.ts';
import { type PageStateHandler } from './PageStateHandler.ts';
import { type ViewConstants } from './ViewConstants';
import type { LapisLineageQuery, LapisLocation, LapisMutationQuery } from './helpers.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/VariantSelector.tsx';
import { type BreadcrumbElement } from '../layouts/Breadcrumbs.tsx';

export type BaselineFilter = {
    location: LapisLocation;
    dateRange: DateRangeOption;
};

export type BaselineData = {
    baselineFilter: BaselineFilter;
};

export type VariantFilter = {
    mutations: LapisMutationQuery;
    lineages: LapisLineageQuery;
};

export type VariantData<VariantFilterType = VariantFilter> = {
    variantFilter: VariantFilterType;
};

export type BaselineAndVariantData = BaselineData & VariantData;

export type Id = number;

export type CompareVariantsData<ColumnData extends BaselineAndVariantData = BaselineAndVariantData> = {
    filters: Map<Id, ColumnData>;
};

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

export function getLineageFilterConfigs(
    lineageFilterConfigs: LineageFilterConfig[],
    lineages: LapisLineageQuery,
): LineageFilterConfig[] {
    return lineageFilterConfigs.map((config) => {
        return {
            ...config,
            initialValue: lineages[config.lapisField] ?? config.initialValue,
        };
    });
}
