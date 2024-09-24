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
import { type OrganismsConfig } from '../config.ts';

const pathFragment = organismConfig[Organisms.westNile].pathFragment;

const today = new Date().toISOString().substring(0, 10);

class WestNileConstants {
    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.westNile.lapis.mainDateField;
    }

    public readonly organism = Organisms.westNile as typeof Organisms.westNile;
    public readonly locationFields = ['geo_loc_country', 'geo_loc_admin_1'];
    public readonly defaultDateRange: DateRange = 'allTimes';
    public readonly earliestDate = '1930-01-01';
    public readonly customDateRangeOptions = [
        { label: 'Since 2020', dateFrom: '2020-01-01', dateTo: today },
        { label: '2010-2019', dateFrom: '2010-01-01', dateTo: '2019-12-31' },
        { label: '2000-2009', dateFrom: '2000-01-01', dateTo: '2009-12-31' },
        { label: 'Since 2000', dateFrom: '2000-01-01', dateTo: today },
        { label: 'Before 2000', dateFrom: this.earliestDate, dateTo: '1999-12-31' },
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

type WestNileView1Route = { variantFilter: LapisVariantQuery1 } & RouteWithBaseline;

export class WestNileView1 extends WestNileConstants implements View<WestNileView1Route> {
    public readonly pathname = `/${pathFragment}/single-variant`;
    public readonly label = 'Single variant';
    public readonly labelLong = 'Analyze a single variant';
    public readonly defaultRoute = {
        organism: Organisms.westNile as typeof Organisms.westNile,
        pathname: this.pathname,
        baselineFilter: {
            location: {},
            dateRange: this.defaultDateRange,
        },
        variantFilter: {},
    };

    public parseUrl = (url: URL): WestNileView1Route => {
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

    public toUrl = (route: WestNileView1Route): string => {
        const search = new URLSearchParams();
        setSearchFromLapisLocation2(search, route.baselineFilter.location);
        if (route.baselineFilter.dateRange !== this.defaultDateRange) {
            setSearchFromDateRange(search, this.mainDateField, route.baselineFilter.dateRange);
        }
        setSearchFromLapisVariantQuery1(search, route.variantFilter);
        return `${this.pathname}?${search}`;
    };

    public toLapisFilter = (route: WestNileView1Route) => {
        return {
            ...this.toLapisFilterWithoutVariant(route),
            ...route.variantFilter,
        };
    };
}

export class WestNileView3 extends WestNileConstants implements View<RouteWithBaseline> {
    public pathname = `/${pathFragment}/sequencing-efforts`;
    public label = 'Sequencing efforts';
    public labelLong = 'Sequencing efforts';
    public readonly defaultRoute = {
        organism: Organisms.westNile as typeof Organisms.westNile,
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
