import {
    type DateRange,
    dateRangeToCustomDateRange,
    getDateRangeFromSearch,
    getStringArrayFromSearch,
    getStringFromSearch,
    setSearchFromDateRange,
    setSearchFromString,
    setSearchFromStringArray,
} from './helpers.ts';
import type { View } from './View.ts';

export namespace RsvAView1 {
    export const organism = 'rsv-a' as const;
    export const pathname = `/${organism}/single-variant` as const;
    export type Pathname = typeof pathname;
    export const defaultDateRange: DateRange = 'allTimes';
    export const earliestDate = '1956-01-01';

    export type Route = {
        organism: typeof organism;
        pathname: Pathname;
        baselineFilter: {
            location: LapisLocation;
            dateRange: DateRange;
        };
        variantFilter: LapisVariantQuery;
    };

    export const parseUrl = (url: URL): Route | undefined => {
        const search = url.searchParams;
        return {
            organism,
            pathname,
            baselineFilter: {
                location: {
                    geo_loc_country: getStringFromSearch(search, 'geo_loc_country'),
                    geo_loc_admin_1: getStringFromSearch(search, 'geo_loc_admin_1'),
                },
                dateRange: getDateRangeFromSearch(search, 'sample_collection_date') ?? defaultDateRange,
            },
            variantFilter: {
                lineage: getStringFromSearch(search, 'lineage'),
                nucleotideMutations: getStringArrayFromSearch(search, 'nucleotideMutations'),
                aminoAcidMutations: getStringArrayFromSearch(search, 'aminoAcidMutations'),
                nucleotideInsertions: getStringArrayFromSearch(search, 'nucleotideInsertions'),
                aminoAcidInsertions: getStringArrayFromSearch(search, 'aminoAcidInsertions'),
            },
        };
    };

    export const toUrl = (route: Route): string => {
        const search = new URLSearchParams();
        (['geo_loc_country', 'geo_loc_admin_1'] as const).forEach((field) =>
            setSearchFromString(search, field, route.baselineFilter.location[field]),
        );
        if (route.baselineFilter.dateRange !== defaultDateRange) {
            setSearchFromDateRange(search, 'sample_collection_date', route.baselineFilter.dateRange);
        }
        (['lineage'] as const).forEach((field) => setSearchFromString(search, field, route.variantFilter[field]));
        (['nucleotideMutations', 'aminoAcidMutations', 'nucleotideInsertions', 'aminoAcidInsertions'] as const).forEach(
            (field) => setSearchFromStringArray(search, field, route.variantFilter[field]),
        );
        return `${pathname}?${search}`;
    };

    export const view: View<Route> = {
        organism,
        pathname,
        label: 'Single variant',
        labelLong: 'Analyze a single variant',
        parseUrl,
        toUrl,
        defaultRoute: {
            organism,
            pathname,
            baselineFilter: {
                location: {},
                dateRange: defaultDateRange,
            },
            variantFilter: {},
        },
    };

    export const toLapisFilter = (route: Route) => {
        return {
            ...toLapisFilterWithoutVariant(route),
            ...route.variantFilter,
        };
    };

    export const toLapisFilterWithoutVariant = (route: Route) => {
        const dateRange = dateRangeToCustomDateRange(route.baselineFilter.dateRange, new Date(RsvAView1.earliestDate));
        return {
            ...route.baselineFilter.location,
            sample_collection_dateFrom: dateRange.from,
            sample_collection_dateTo: dateRange.to,
        };
    };

    export type LapisLocation = {
        geo_loc_country?: string;
        geo_loc_admin_1?: string;
    };

    export type LapisVariantQuery = {
        lineage?: string;
        nucleotideMutations?: string[];
        aminoAcidMutations?: string[];
        nucleotideInsertions?: string[];
        aminoAcidInsertions?: string[];
    };
}
