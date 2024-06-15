import {
    type DateRange,
    dateRangeToCustomDateRange,
    getDateRangeFromSearch,
    getLapisLocation2FromSearch,
    getLapisVariantQuery1FromSearch,
    type LapisLocation2,
    type LapisVariantQuery1,
    setSearchFromDateRange,
    setSearchFromLapisLocation2,
    setSearchFromLapisVariantQuery1,
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
            location: LapisLocation2;
            dateRange: DateRange;
        };
        variantFilter: LapisVariantQuery1;
    };

    export const parseUrl = (url: URL): Route | undefined => {
        const search = url.searchParams;
        return {
            organism,
            pathname,
            baselineFilter: {
                location: getLapisLocation2FromSearch(search),
                dateRange: getDateRangeFromSearch(search, 'sample_collection_date') ?? defaultDateRange,
            },
            variantFilter: getLapisVariantQuery1FromSearch(search),
        };
    };

    export const toUrl = (route: Route): string => {
        const search = new URLSearchParams();
        setSearchFromLapisLocation2(search, route.baselineFilter.location);
        if (route.baselineFilter.dateRange !== defaultDateRange) {
            setSearchFromDateRange(search, 'sample_collection_date', route.baselineFilter.dateRange);
        }
        setSearchFromLapisVariantQuery1(search, route.variantFilter);
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
}
