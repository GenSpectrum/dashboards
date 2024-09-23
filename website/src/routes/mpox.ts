import {
    type DateRange,
    type DateRangeOption,
    dateRangeToCustomDateRange,
    getDateRangeFromSearch,
    getLapisLocation2FromSearch,
    getLapisVariantQuery2FromSearch,
    type LapisLocation2,
    type LapisVariantQuery2,
    type SampleCollectionDateFromTo,
    setSearchFromDateRange,
    setSearchFromLapisLocation2,
    setSearchFromLapisVariantQuery2,
} from './helpers.ts';
import { organismConfig, Organisms, type Route, type View } from './View.ts';

const organism = Organisms.mpox as typeof Organisms.mpox;
const pathFragment = organismConfig[organism].pathFragment;
const locationFields = ['geo_loc_country', 'geo_loc_admin_1'];

const defaultDateRange: DateRange = 'allTimes';
const earliestDate = '1960-01-01';
const today = new Date().toISOString().substring(0, 10);
const customDateRangeOptions = [
    { label: '2024', dateFrom: '2024-01-01', dateTo: today },
    { label: '2023', dateFrom: '2023-01-01', dateTo: '2023-12-31' },
    { label: '2022', dateFrom: '2022-01-01', dateTo: '2022-12-31' },
    { label: '2021', dateFrom: '2021-01-01', dateTo: '2021-12-31' },
    { label: 'Since 2021', dateFrom: '2021-01-01', dateTo: today },
    { label: 'Before 2021', dateFrom: earliestDate, dateTo: '2020-12-31' },
    { label: 'Since 2017', dateFrom: '2017-01-01', dateTo: today },
    { label: '2017-2020', dateFrom: '2017-01-01', dateTo: '2020-12-31' },
    { label: 'Before 2017', dateFrom: earliestDate, dateTo: '2016-12-31' },
];

type Constants = {
    earliestDate: string;
    locationFields: string[];
    customDateRangeOptions: DateRangeOption[];
};

const constants = { organism, earliestDate, locationFields, customDateRangeOptions };

type RouteWithBaseline = Route & {
    baselineFilter: {
        location: LapisLocation2;
        dateRange: DateRange;
    };
};

const toLapisFilterWithoutVariant = (route: RouteWithBaseline): SampleCollectionDateFromTo & LapisLocation2 => {
    const dateRange = dateRangeToCustomDateRange(route.baselineFilter.dateRange, new Date(MpoxView1.view.earliestDate));
    return {
        ...route.baselineFilter.location,
        sample_collection_dateFrom: dateRange.from,
        sample_collection_dateTo: dateRange.to,
    };
};

export namespace MpoxView1 {
    const pathname = `/${pathFragment}/single-variant`;

    type Route = { variantFilter: LapisVariantQuery2 } & RouteWithBaseline;

    const parseUrl = (url: URL): Route => {
        const search = url.searchParams;
        return {
            organism,
            pathname,
            baselineFilter: {
                location: getLapisLocation2FromSearch(search),
                dateRange: getDateRangeFromSearch(search, 'sample_collection_date') ?? defaultDateRange,
            },
            variantFilter: getLapisVariantQuery2FromSearch(search),
        };
    };

    const toUrl = (route: Route): string => {
        const search = new URLSearchParams();
        setSearchFromLapisLocation2(search, route.baselineFilter.location);
        if (route.baselineFilter.dateRange !== defaultDateRange) {
            setSearchFromDateRange(search, 'sample_collection_date', route.baselineFilter.dateRange);
        }
        setSearchFromLapisVariantQuery2(search, route.variantFilter);
        return `${pathname}?${search}`;
    };

    const toLapisFilter = (route: Route) => {
        return {
            ...toLapisFilterWithoutVariant(route),
            ...route.variantFilter,
        };
    };

    export type MpoxView1 = View<Route> &
        Constants & {
            toLapisFilter: (route: Route) => SampleCollectionDateFromTo & LapisLocation2 & LapisVariantQuery2;
            toLapisFilterWithoutVariant: (route: Route) => SampleCollectionDateFromTo & LapisLocation2;
        };

    export const view: MpoxView1 = {
        ...constants,
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
        toLapisFilter,
        toLapisFilterWithoutVariant,
    };
}

export namespace MpoxView3 {
    const pathname = `/${pathFragment}/sequencing-efforts`;

    const parseUrl = (url: URL): RouteWithBaseline => {
        const search = url.searchParams;
        return {
            organism,
            pathname,
            baselineFilter: {
                location: getLapisLocation2FromSearch(search),
                dateRange: getDateRangeFromSearch(search, 'sample_collection_date') ?? defaultDateRange,
            },
        };
    };

    const toUrl = (route: RouteWithBaseline): string => {
        const search = new URLSearchParams();
        setSearchFromLapisLocation2(search, route.baselineFilter.location);
        if (route.baselineFilter.dateRange !== defaultDateRange) {
            setSearchFromDateRange(search, 'sample_collection_date', route.baselineFilter.dateRange);
        }
        return `${pathname}?${search}`;
    };

    export type MpoxView3 = View<RouteWithBaseline> &
        Constants & {
            toLapisFilter: (route: RouteWithBaseline) => SampleCollectionDateFromTo & LapisLocation2;
        };

    export const view: MpoxView3 = {
        ...constants,
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
        toLapisFilter: toLapisFilterWithoutVariant,
    };
}
