import {
    type DateRange,
    dateRangeToCustomDateRange,
    getDateRangeFromSearch,
    getLapisLocation2FromSearch,
    getLapisVariantQuery2FromSearch,
    type LapisFilter,
    type LapisLocation2,
    type LapisVariantQuery2,
    setSearchFromDateRange,
    setSearchFromLapisLocation2,
    setSearchFromLapisVariantQuery2,
} from './helpers.ts';
import { organismConfig, Organisms, type Route, type View } from './View.ts';
import { type OrganismsConfig } from '../config.ts';

const pathFragment = organismConfig[Organisms.mpox].pathFragment;

const earliestDate = '1960-01-01';
const today = new Date().toISOString().substring(0, 10);

class MpoxConstants {
    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.mpox.lapis.mainDateField;
    }

    public readonly organism = Organisms.mpox as typeof Organisms.mpox;
    public readonly earliestDate = '1960-01-01';
    public readonly locationFields = ['geo_loc_country', 'geo_loc_admin_1'];
    public readonly defaultDateRange: DateRange = 'allTimes';
    public readonly customDateRangeOptions = [
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
    public readonly mainDateField: string;

    public toLapisFilterWithoutVariant = (route: RouteWithBaseline): LapisFilter & LapisLocation2 => {
        const dateRange = dateRangeToCustomDateRange(route.baselineFilter.dateRange, new Date(this.earliestDate));
        return {
            ...route.baselineFilter.location,
            [`${this.mainDateField}From`]: dateRange.from,
            [`${this.mainDateField}To`]: dateRange.to,
        };
    };
}

type RouteWithBaseline = Route & {
    baselineFilter: {
        location: LapisLocation2;
        dateRange: DateRange;
    };
};

type MpoxView1Route = { variantFilter: LapisVariantQuery2 } & RouteWithBaseline;

export class MpoxView1 extends MpoxConstants implements View<MpoxView1Route> {
    public readonly pathname = `/${pathFragment}/single-variant`;
    public readonly label = 'Single variant';
    public readonly labelLong = 'Analyze a single variant';
    public readonly defaultRoute = {
        organism: this.organism,
        pathname: this.pathname,
        baselineFilter: {
            location: {},
            dateRange: this.defaultDateRange,
        },
        variantFilter: {},
    };

    public parseUrl = (url: URL): MpoxView1Route => {
        const search = url.searchParams;
        return {
            organism: this.organism,
            pathname: this.pathname,
            baselineFilter: {
                location: getLapisLocation2FromSearch(search),
                dateRange: getDateRangeFromSearch(search, this.mainDateField) ?? this.defaultDateRange,
            },
            variantFilter: getLapisVariantQuery2FromSearch(search),
        };
    };

    public toUrl = (route: MpoxView1Route): string => {
        const search = new URLSearchParams();
        setSearchFromLapisLocation2(search, route.baselineFilter.location);
        if (route.baselineFilter.dateRange !== this.defaultDateRange) {
            setSearchFromDateRange(search, this.mainDateField, route.baselineFilter.dateRange);
        }
        setSearchFromLapisVariantQuery2(search, route.variantFilter);
        return `${this.pathname}?${search}`;
    };

    public toLapisFilter = (route: MpoxView1Route) => {
        return {
            ...this.toLapisFilterWithoutVariant(route),
            ...route.variantFilter,
        };
    };
}

export class MpoxView3 extends MpoxConstants implements View<RouteWithBaseline> {
    public readonly pathname = `/${pathFragment}/sequencing-efforts`;
    public readonly label = 'Sequencing efforts';
    public readonly labelLong = 'Sequencing efforts';
    public readonly defaultRoute = {
        organism: this.organism,
        pathname: this.pathname,
        baselineFilter: {
            location: {},
            dateRange: this.defaultDateRange,
        },
    };

    public parseUrl = (url: URL): RouteWithBaseline => {
        const search = url.searchParams;
        return {
            organism: this.organism,
            pathname: this.pathname,
            baselineFilter: {
                location: getLapisLocation2FromSearch(search),
                dateRange: getDateRangeFromSearch(search, this.mainDateField) ?? this.defaultDateRange,
            },
        };
    };

    public toUrl = (route: RouteWithBaseline): string => {
        const search = new URLSearchParams();
        setSearchFromLapisLocation2(search, route.baselineFilter.location);
        if (route.baselineFilter.dateRange !== this.defaultDateRange) {
            setSearchFromDateRange(search, this.mainDateField, route.baselineFilter.dateRange);
        }
        return `${this.pathname}?${search}`;
    };

    public toLapisFilter = (route: RouteWithBaseline): LapisFilter => {
        return this.toLapisFilterWithoutVariant(route);
    };
}
