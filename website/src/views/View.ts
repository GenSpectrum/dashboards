import type { DateRangeOption } from '@genspectrum/dashboard-components/util';

import type { LapisLineageQuery, LapisLocation, LapisMutationQuery } from './helpers.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/VariantSelector.tsx';
import { defaultBreadcrumbs } from '../layouts/Breadcrumbs.tsx';
import { type Organism, organismConfig } from '../types/Organism.ts';

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

/**
 * PageState is the state of the organism pages. It:
 * - can be set by users via input components
 * - is used to compute LAPIS filters for the visualization components
 * - is stored in the URL as query parameters
 * - must be parsable from the URL query parameters
 */
export type View<PageState extends object> = {
    organism: Organism;
    pathname: string;
    label: string;
    labelLong: string;
    defaultPageState: PageState;

    parsePageStateFromUrl: (url: URL) => PageState;
    toUrl: (pageState: PageState) => string;
    getDefaultPageState: () => string;
};

export const defaultTablePageSize = 200;

export function getViewBreadcrumbEntries<PageState extends object>(view: View<PageState>) {
    return [
        ...defaultBreadcrumbs,
        { name: organismConfig[view.organism].label },
        {
            name: view.label,
            href: view.pathname,
        },
    ];
}

export function getViewTitle<PageState extends object>(view: View<PageState>) {
    return `${view.label} | ${organismConfig[view.organism].label} | GenSpectrum`;
}

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
