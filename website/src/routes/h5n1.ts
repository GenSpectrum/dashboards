import {
    type DateRange,
    dateRangeToCustomDateRange,
    getDateRangeFromSearch,
    getLapisLocationFromSearch,
    getLapisVariantQuery,
    getTodayString,
    type LapisFilter,
    setSearchFromDateRange,
    setSearchFromLapisVariantQuery,
    setSearchFromLocation,
} from './helpers.ts';
import {
    type AnalyzeSingleVariantRoute,
    organismConfig,
    Organisms,
    type RouteWithBaseline,
    type View,
} from './View.ts';
import type { OrganismsConfig } from '../config.ts';

const pathFragment = organismConfig[Organisms.h5n1].pathFragment;

const earliestDate = '1905-01-01';
const today = getTodayString();

class H5n1Constants {
    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.h5n1.lapis.mainDateField;
        this.locationFields = organismsConfig.h5n1.lapis.locationFields;
        this.lineageField = organismsConfig.h5n1.lapis.lineageField;
    }

    public readonly organism = Organisms.h5n1 as typeof Organisms.h5n1;
    public readonly earliestDate = '1905-01-01';
    public readonly defaultDateRange: DateRange = 'last6Months';
    public readonly customDateRangeOptions = [
        { label: 'Since 2020', dateFrom: '2020-01-01', dateTo: today },
        { label: '2010-2019', dateFrom: '2010-01-01', dateTo: '2019-12-31' },
        { label: '2000-2009', dateFrom: '2000-01-01', dateTo: '2009-12-31' },
        { label: 'Since 2000', dateFrom: '2000-01-01', dateTo: today },
        { label: 'Before 2000', dateFrom: earliestDate, dateTo: '1999-12-31' },
    ];
    public readonly mainDateField: string;
    public readonly locationFields: string[];
    public readonly lineageField: string;

    public toLapisFilterWithoutVariant = (route: RouteWithBaseline): LapisFilter => {
        const dateRange = dateRangeToCustomDateRange(route.baselineFilter.dateRange, new Date(this.earliestDate));
        return {
            ...route.baselineFilter.location,
            [`${this.mainDateField}From`]: dateRange.from,
            [`${this.mainDateField}To`]: dateRange.to,
        };
    };
}

export class H5n1AnalyzeSingleVariantView extends H5n1Constants implements View<AnalyzeSingleVariantRoute> {
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

    public parseUrl = (url: URL): AnalyzeSingleVariantRoute => {
        const search = url.searchParams;
        return {
            organism: this.organism,
            pathname: this.pathname,
            baselineFilter: {
                location: getLapisLocationFromSearch(search, this.locationFields),
                dateRange: getDateRangeFromSearch(search, this.mainDateField) ?? this.defaultDateRange,
            },
            variantFilter: getLapisVariantQuery(search, this.lineageField),
        };
    };

    public toUrl = (route: AnalyzeSingleVariantRoute): string => {
        const search = new URLSearchParams();
        setSearchFromLocation(search, route.baselineFilter.location);
        if (route.baselineFilter.dateRange !== this.defaultDateRange) {
            setSearchFromDateRange(search, this.mainDateField, route.baselineFilter.dateRange);
        }
        setSearchFromLapisVariantQuery(search, route.variantFilter, this.lineageField);
        return `${this.pathname}?${search}`;
    };

    public toLapisFilter = (route: AnalyzeSingleVariantRoute): LapisFilter => {
        return {
            ...this.toLapisFilterWithoutVariant(route),
            ...route.variantFilter,
        };
    };
}

export class H5n1SequencingEffortsView extends H5n1Constants implements View<RouteWithBaseline> {
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
                location: getLapisLocationFromSearch(search, this.locationFields),
                dateRange: getDateRangeFromSearch(search, this.mainDateField) ?? this.defaultDateRange,
            },
        };
    };

    public toUrl = (route: RouteWithBaseline): string => {
        const search = new URLSearchParams();
        setSearchFromLocation(search, route.baselineFilter.location);
        if (route.baselineFilter.dateRange !== this.defaultDateRange) {
            setSearchFromDateRange(search, this.mainDateField, route.baselineFilter.dateRange);
        }
        return `${this.pathname}?${search}`;
    };

    public toLapisFilter = (route: RouteWithBaseline): LapisFilter => {
        return this.toLapisFilterWithoutVariant(route);
    };
}
