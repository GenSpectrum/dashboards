import { type AnalyzeSingleVariantRoute, type Route, type View } from './View.ts';
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
import { type OrganismsConfig } from '../config.ts';
import { organismConfig, Organisms } from '../types/Organism.ts';

const pathFragment = organismConfig[Organisms.mpox].pathFragment;

const earliestDate = '1960-01-01';
const today = getTodayString();

class MpoxConstants {
    public readonly organism = Organisms.mpox;
    public readonly earliestDate = '1960-01-01';
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
    public readonly locationFields: string[];
    public readonly lineageField: string;
    public readonly cladeField = 'clade';
    public readonly hostField: string;
    public readonly authorsField: string | undefined;
    public readonly authorAffiliationsField: string | undefined;

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.mpox.lapis.mainDateField;
        this.locationFields = organismsConfig.mpox.lapis.locationFields;
        this.lineageField = organismsConfig.mpox.lapis.lineageField;
        this.hostField = organismsConfig.mpox.lapis.hostField;
        this.authorsField = organismsConfig.mpox.lapis.authorsField;
        this.authorAffiliationsField = organismsConfig.mpox.lapis.authorAffiliationsField;
    }

    public toLapisFilterWithoutVariant = (route: RouteWithBaseline): LapisFilter & LapisLocation => {
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
        location: LapisLocation;
        dateRange: DateRange;
    };
};

export class MpoxAnalyzeSingleVariantView extends MpoxConstants implements View<AnalyzeSingleVariantRoute> {
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
            variantFilter: getLapisVariantQuery(search, this.lineageField, this.cladeField),
        };
    };

    public toUrl = (route: AnalyzeSingleVariantRoute): string => {
        const search = new URLSearchParams();
        setSearchFromLocation(search, route.baselineFilter.location);
        if (route.baselineFilter.dateRange !== this.defaultDateRange) {
            setSearchFromDateRange(search, this.mainDateField, route.baselineFilter.dateRange);
        }
        setSearchFromLapisVariantQuery(search, route.variantFilter, this.lineageField, this.cladeField);
        return `${this.pathname}?${search}`;
    };

    public toLapisFilter = (route: AnalyzeSingleVariantRoute) => {
        return {
            ...this.toLapisFilterWithoutVariant(route),
            ...route.variantFilter,
        };
    };
}

export class MpoxSequencingEffortsView extends MpoxConstants implements View<RouteWithBaseline> {
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
