import type { DateRange, LapisLocation, LapisVariantQuery } from './helpers.ts';
import { defaultBreadcrumbs } from '../layouts/Breadcrumbs.tsx';
import { type Organism, organismConfig } from '../types/Organism.ts';

export type BaselineData = {
    baselineFilter: {
        location: LapisLocation;
        dateRange: DateRange;
    };
};

export type VariantData = {
    variantFilter: LapisVariantQuery;
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
