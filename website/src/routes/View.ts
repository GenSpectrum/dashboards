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
 * PageData is the state of the organism pages. It:
 * - can be set by users via input components
 * - is used to compute LAPIS filters for the visualization components
 * - is stored in the URL as query parameters
 * - must be parsable from the URL query parameters
 */
export type View<PageData extends object> = {
    organism: Organism;
    pathname: string;
    label: string;
    labelLong: string;
    defaultPageData: PageData;

    parsePageDataFromUrl: (url: URL) => PageData;
    toUrl: (route: PageData) => string;
    getDefaultPageData: () => string;
};

export const defaultTablePageSize = 200;
