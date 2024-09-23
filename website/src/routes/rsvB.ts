import {
    type DateRange,
    type DateRangeOption,
    dateRangeToCustomDateRange,
    getDateRangeFromSearch,
    getLapisLocation2FromSearch,
    getLapisVariantQuery1FromSearch,
    type LapisLocation2,
    type LapisVariantQuery1,
    type SampleCollectionDateFromTo,
    setSearchFromDateRange,
    setSearchFromLapisLocation2,
    setSearchFromLapisVariantQuery1,
} from './helpers.ts';
import { organismConfig, Organisms, type Route, type View } from './View.ts';

const organism = Organisms.rsvB as typeof Organisms.rsvB;
const pathFragment = organismConfig[organism].pathFragment;
const locationFields = ['geo_loc_country', 'geo_loc_admin_1'];

const defaultDateRange: DateRange = 'allTimes';
const earliestDate = '1956-01-01';
const today = new Date().toISOString().substring(0, 10);
const customDateRangeOptions = [
    { label: 'Since 2020', dateFrom: '2020-01-01', dateTo: today },
    { label: '2010-2019', dateFrom: '2010-01-01', dateTo: '2019-12-31' },
    { label: '2000-2009', dateFrom: '2000-01-01', dateTo: '2009-12-31' },
    { label: 'Since 2000', dateFrom: '2000-01-01', dateTo: today },
    { label: 'Before 2000', dateFrom: earliestDate, dateTo: '1999-12-31' },
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
    const dateRange = dateRangeToCustomDateRange(route.baselineFilter.dateRange, new Date(RsvBView1.view.earliestDate));
    return {
        ...route.baselineFilter.location,
        sample_collection_dateFrom: dateRange.from,
        sample_collection_dateTo: dateRange.to,
    };
};

export namespace RsvBView1 {
    const pathname = `/${pathFragment}/single-variant`;

    type Route = { variantFilter: LapisVariantQuery1 } & RouteWithBaseline;

    const parseUrl = (url: URL): Route => {
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

    const toUrl = (route: Route): string => {
        const search = new URLSearchParams();
        setSearchFromLapisLocation2(search, route.baselineFilter.location);
        if (route.baselineFilter.dateRange !== defaultDateRange) {
            setSearchFromDateRange(search, 'sample_collection_date', route.baselineFilter.dateRange);
        }
        setSearchFromLapisVariantQuery1(search, route.variantFilter);
        return `${pathname}?${search}`;
    };

    const toLapisFilter = (route: Route) => {
        return {
            ...toLapisFilterWithoutVariant(route),
            ...route.variantFilter,
        };
    };

    export type RsvBView1 = View<Route> &
        Constants & {
            toLapisFilter: (route: Route) => SampleCollectionDateFromTo & LapisLocation2 & LapisVariantQuery1;
            toLapisFilterWithoutVariant: (route: Route) => SampleCollectionDateFromTo & LapisLocation2;
        };

    export const view: RsvBView1 = {
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

export namespace RsvBView3 {
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

    export type RsvBView3 = View<RouteWithBaseline> &
        Constants & {
            toLapisFilter: (route: RouteWithBaseline) => SampleCollectionDateFromTo & LapisLocation2;
        };

    export const view: RsvBView3 = {
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
