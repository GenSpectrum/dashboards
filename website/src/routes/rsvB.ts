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

const pathFragment = organismConfig[Organisms.rsvB].pathFragment;

const today = new Date().toISOString().substring(0, 10);

class RsvBConstants {
    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.rsvB.lapis.mainDateField;
    }

    public readonly organism = Organisms.rsvB as typeof Organisms.rsvB;
    public readonly locationFields = ['geo_loc_country', 'geo_loc_admin_1'];
    public readonly defaultDateRange: DateRange = 'allTimes';
    public readonly earliestDate = '1956-01-01';
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

type RsvBView1Route = { variantFilter: LapisVariantQuery1 } & RouteWithBaseline;

export class RsvBView1 extends RsvBConstants implements View<RsvBView1Route> {
    public pathname = `/${pathFragment}/single-variant`;
    public label = 'Single variant';
    public labelLong = 'Analyze a single variant';
    public defaultRoute = {
        organism: this.organism,
        pathname: this.pathname,
        baselineFilter: {
            location: {},
            dateRange: this.defaultDateRange,
        },
        variantFilter: {},
    };

    public parseUrl = (url: URL): RsvBView1Route => {
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

    public toUrl = (route: RsvBView1Route): string => {
        const search = new URLSearchParams();
        setSearchFromLapisLocation2(search, route.baselineFilter.location);
        if (route.baselineFilter.dateRange !== this.defaultDateRange) {
            setSearchFromDateRange(search, this.mainDateField, route.baselineFilter.dateRange);
        }
        setSearchFromLapisVariantQuery1(search, route.variantFilter);
        return `${this.pathname}?${search}`;
    };

    public toLapisFilter = (route: RsvBView1Route) => {
        return {
            ...this.toLapisFilterWithoutVariant(route),
            ...route.variantFilter,
        };
    };
}

export class RsvBView3 extends RsvBConstants implements View<RouteWithBaseline> {
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

    public toLapisFilter = (route: RouteWithBaseline) => {
        return this.toLapisFilterWithoutVariant(route);
    };
}
