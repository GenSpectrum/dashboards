import {
    type DateRange,
    dateRangeToCustomDateRange,
    getDateRangeFromSearch,
    getIntegerFromSearch,
    getStringFromSearch,
    type LapisLocation1,
    setSearchFromDateRange,
    setSearchFromString,
} from './helpers.ts';
import type { View } from './View.ts';

export namespace CovidView3 {
    export const organism = 'covid' as const;
    export const pathname = `/${organism}/sequencing-efforts` as const;
    export type Pathname = typeof pathname;
    export const defaultDateRange: DateRange = 'last6Months';
    export const earliestDate = '2020-01-06';

    export type Route = {
        organism: typeof organism;
        pathname: Pathname;
        collectionId?: number;
        baselineFilter: {
            location: LapisLocation1;
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
                    region: getStringFromSearch(search, 'region'),
                    country: getStringFromSearch(search, 'country'),
                    division: getStringFromSearch(search, 'division'),
                },
                dateRange: getDateRangeFromSearch(search, 'date') ?? defaultDateRange,
            },
            collectionId: getIntegerFromSearch(search, 'collectionId'),
        };
    };

    export const toUrl = (route: Route): string => {
        const search = new URLSearchParams();
        (['region', 'country', 'division'] as const).forEach((field) =>
            setSearchFromString(search, field, route.baselineFilter.location[field]),
        );
        if (route.baselineFilter.dateRange !== defaultDateRange) {
            setSearchFromDateRange(search, 'date', route.baselineFilter.dateRange);
        }
        if (route.collectionId !== undefined) {
            search.set('collectionId', route.collectionId.toString());
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
        const dateRange = dateRangeToCustomDateRange(route.baselineFilter.dateRange, new Date(CovidView3.earliestDate));
        return {
            ...route.baselineFilter.location,
            dateFrom: dateRange.from,
            dateTo: dateRange.to,
        };
    };
}
