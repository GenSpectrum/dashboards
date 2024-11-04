import type { DateRange, LapisLocation, LapisVariantQuery } from './helpers.ts';
import type { Organism } from '../types/Organism.ts';

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
