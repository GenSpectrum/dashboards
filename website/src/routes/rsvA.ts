import { type AnalyzeSingleVariantRoute, type RouteWithBaseline, type View } from './View.ts';
import {
    type DateRange,
    dateRangeToCustomDateRange,
    getDateRangeFromSearch,
    getLapisLocationFromSearch,
    getLapisVariantQuery,
    getTodayString,
    type LapisFilter,
    type LapisLocation,
    setSearchFromDateRange,
    setSearchFromLapisVariantQuery,
    setSearchFromLocation,
} from './helpers.ts';
import type { OrganismsConfig } from '../config.ts';
import { organismConfig, Organisms } from '../types/Organism.ts';

const pathFragment = organismConfig[Organisms.rsvA].pathFragment;

const today = getTodayString();

class RsvAConstants {
    public readonly organism = Organisms.rsvA;
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
    public readonly locationFields: string[];
    public readonly lineageField: string;
    public readonly hostField: string;
    public readonly authorsField: string | undefined;
    public readonly authorAffiliationsField: string | undefined;
    public readonly additionalFilters: Record<string, string> | undefined;

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.rsvA.lapis.mainDateField;
        this.locationFields = organismsConfig.rsvA.lapis.locationFields;
        this.lineageField = organismsConfig.rsvA.lapis.lineageField;
        this.hostField = organismsConfig.rsvA.lapis.hostField;
        this.authorsField = organismsConfig.rsvA.lapis.authorsField;
        this.authorAffiliationsField = organismsConfig.rsvA.lapis.authorAffiliationsField;
        this.additionalFilters = organismsConfig.rsvA.lapis.additionalFilters;
    }

    public toLapisFilterWithoutVariant(route: RouteWithBaseline): LapisFilter & LapisLocation {
        const dateRange = dateRangeToCustomDateRange(route.baselineFilter.dateRange, new Date(this.earliestDate));
        return {
            ...route.baselineFilter.location,
            [`${this.mainDateField}From`]: dateRange.from,
            [`${this.mainDateField}To`]: dateRange.to,
            ...this.additionalFilters,
        };
    }
}

export class RsvAAnalyzeSingleVariantView extends RsvAConstants implements View<AnalyzeSingleVariantRoute> {
    public readonly pathname = `/${pathFragment}/single-variant`;
    public readonly label = 'Single variant';
    public readonly labelLong = 'Analyze a single variant';
    public readonly defaultRoute: AnalyzeSingleVariantRoute = {
        organism: this.organism,
        pathname: this.pathname,
        baselineFilter: {
            location: {},
            dateRange: this.defaultDateRange,
        },
        variantFilter: {},
    };

    public parseUrl(url: URL): AnalyzeSingleVariantRoute {
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
    }

    public toUrl(route: AnalyzeSingleVariantRoute): string {
        const search = new URLSearchParams();
        setSearchFromLocation(search, route.baselineFilter.location);
        if (route.baselineFilter.dateRange !== this.defaultDateRange) {
            setSearchFromDateRange(search, this.mainDateField, route.baselineFilter.dateRange);
        }
        setSearchFromLapisVariantQuery(search, route.variantFilter, this.lineageField);
        return `${this.pathname}?${search}`;
    }

    public toLapisFilter(route: AnalyzeSingleVariantRoute) {
        return {
            ...this.toLapisFilterWithoutVariant(route),
            ...route.variantFilter,
        };
    }

    public getDefaultRouteUrl() {
        return this.toUrl(this.defaultRoute);
    }
}

export class RsvASequencingEffortsView extends RsvAConstants implements View<RouteWithBaseline> {
    public readonly pathname = `/${pathFragment}/sequencing-efforts`;
    public readonly label = 'Sequencing efforts';
    public readonly labelLong = 'Sequencing efforts';
    public readonly defaultRoute: RouteWithBaseline = {
        organism: this.organism,
        pathname: this.pathname,
        baselineFilter: {
            location: {},
            dateRange: this.defaultDateRange,
        },
    };

    public parseUrl(url: URL): RouteWithBaseline {
        const search = url.searchParams;
        return {
            organism: this.organism,
            pathname: this.pathname,
            baselineFilter: {
                location: getLapisLocationFromSearch(search, this.locationFields),
                dateRange: getDateRangeFromSearch(search, this.mainDateField) ?? this.defaultDateRange,
            },
        };
    }

    public toUrl(route: RouteWithBaseline): string {
        const search = new URLSearchParams();
        setSearchFromLocation(search, route.baselineFilter.location);
        if (route.baselineFilter.dateRange !== this.defaultDateRange) {
            setSearchFromDateRange(search, this.mainDateField, route.baselineFilter.dateRange);
        }
        return `${this.pathname}?${search}`;
    }

    public toLapisFilter(route: RouteWithBaseline) {
        return this.toLapisFilterWithoutVariant(route);
    }

    public getDefaultRouteUrl() {
        return this.toUrl(this.defaultRoute);
    }
}
