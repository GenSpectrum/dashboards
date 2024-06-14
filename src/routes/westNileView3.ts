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

export namespace WestNileView3 {
    export const organism = 'west-nile' as const;
    export const pathname = `/${organism}/sequencing-efforts` as const;
    export type Pathname = typeof pathname;
    export const defaultDateRange: DateRange = 'allTimes';
    export const earliestDate = '1930-01-01';

    export type Route = {
        organism: typeof organism;
        pathname: Pathname;
        baselineFilter: {
            location: LapisLocation;
            dateRange: DateRange;
        };
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
        return `${pathname}?${search}`;
    };

    export const view: View<Route> = {
        organism,
        pathname,
        label: 'Sequencing efforts',
        labelLong: 'Sequencing efforts',
        parseUrl,
        toUrl,
        defaultRoute: {
            organism,
            pathname,
            baselineFilter: {
                location: {},
                dateRange: defaultDateRange,
            },
        },
    };

    export const toLapisFilter = (route: Route) => {
        const dateRange = dateRangeToCustomDateRange(
            route.baselineFilter.dateRange,
            new Date(WestNileView3.earliestDate),
        );
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
}
