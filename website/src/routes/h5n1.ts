import {
    type DateRange,
    dateRangeToCustomDateRange,
    getDateRangeFromSearch,
    getLapisLocation2FromSearch,
    getLapisVariantQuery1FromSearch,
    type LapisFilter,
    type LapisLocation2,
    type LapisVariantQuery1,
    setSearchFromDateRange,
    setSearchFromLapisLocation2,
    setSearchFromLapisVariantQuery1,
} from './helpers.ts';
import { organismConfig, Organisms, type Route, type View } from './View.ts';
import type { OrganismsConfig } from '../config.ts';

const pathFragment = organismConfig[Organisms.h5n1].pathFragment;

const earliestDate = '1905-01-01';
const today = new Date().toISOString().substring(0, 10);

class H5n1Constants {
    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.h5n1.lapis.mainDateField;
    }

    public readonly organism = Organisms.h5n1 as typeof Organisms.h5n1;
    public readonly earliestDate = '1905-01-01';
    public readonly locationFields = ['geo_loc_country', 'geo_loc_admin_1'];
    public readonly defaultDateRange: DateRange = 'last6Months';
    public readonly customDateRangeOptions = [
        { label: 'Since 2020', dateFrom: '2020-01-01', dateTo: today },
        { label: '2010-2019', dateFrom: '2010-01-01', dateTo: '2019-12-31' },
        { label: '2000-2009', dateFrom: '2000-01-01', dateTo: '2009-12-31' },
        { label: 'Since 2000', dateFrom: '2000-01-01', dateTo: today },
        { label: 'Before 2000', dateFrom: earliestDate, dateTo: '1999-12-31' },
    ];
    public readonly mainDateField: string;

    public toLapisFilterWithoutVariant = (route: RouteWithBaseline): LapisFilter => {
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

type H5n1View1Route = { variantFilter: LapisVariantQuery1 } & RouteWithBaseline;

export class H5n1View1 extends H5n1Constants implements View<H5n1View1Route> {
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

    public parseUrl = (url: URL): H5n1View1Route => {
        const search = url.searchParams;
        return {
            organism: this.organism,
            pathname: this.pathname,
            baselineFilter: {
                location: getLapisLocation2FromSearch(search),
                dateRange: getDateRangeFromSearch(search, this.mainDateField) ?? this.defaultDateRange,
            },
            variantFilter: getLapisVariantQuery1FromSearch(search),
        };
    };

    public toUrl = (route: H5n1View1Route): string => {
        const search = new URLSearchParams();
        setSearchFromLapisLocation2(search, route.baselineFilter.location);
        if (route.baselineFilter.dateRange !== this.defaultDateRange) {
            setSearchFromDateRange(search, this.mainDateField, route.baselineFilter.dateRange);
        }
        setSearchFromLapisVariantQuery1(search, route.variantFilter);
        return `${this.pathname}?${search}`;
    };

    public toLapisFilter = (route: H5n1View1Route): LapisFilter => {
        return {
            ...this.toLapisFilterWithoutVariant(route),
            ...route.variantFilter,
        };
    };
}

export class H5n1View3 extends H5n1Constants implements View<RouteWithBaseline> {
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
