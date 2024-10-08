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
import {
    type AnalyzeSingleVariantRouteWithLatestVersion,
    organismConfig,
    Organisms,
    type RouteWithBaselineWithLatestVersion,
    type View,
} from './View.ts';
import { type OrganismsConfig } from '../config.ts';

const pathFragment = organismConfig[Organisms.westNile].pathFragment;

class WestNileConstants {
    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.westNile.lapis.mainDateField;
        this.locationFields = organismsConfig.westNile.lapis.locationFields;
        this.lineageField = organismsConfig.westNile.lapis.lineageField;
        this.hostField = organismsConfig.westNile.lapis.hostField;
        this.authorsField = organismsConfig.westNile.lapis.authorsField;
        this.authorAffiliationsField = organismsConfig.westNile.lapis.authorAffiliationsField;
    }

    public readonly organism = Organisms.westNile as typeof Organisms.westNile;
    public readonly defaultDateRange: DateRange = 'allTimes';
    public readonly earliestDate = '1930-01-01';
    public readonly customDateRangeOptions = [
        { label: 'Since 2020', dateFrom: '2020-01-01', dateTo: getTodayString() },
        { label: '2010-2019', dateFrom: '2010-01-01', dateTo: '2019-12-31' },
        { label: '2000-2009', dateFrom: '2000-01-01', dateTo: '2009-12-31' },
        { label: 'Since 2000', dateFrom: '2000-01-01', dateTo: getTodayString() },
        { label: 'Before 2000', dateFrom: this.earliestDate, dateTo: '1999-12-31' },
    ];
    public readonly mainDateField: string;
    public readonly locationFields: string[];
    public readonly lineageField: string;
    public readonly hostField: string;
    public readonly authorsField: string | undefined;
    public readonly authorAffiliationsField: string | undefined;

    public toLapisFilterWithoutVariant = (route: RouteWithBaselineWithLatestVersion): LapisFilter => {
        const dateRange = dateRangeToCustomDateRange(route.baselineFilter.dateRange, new Date(this.earliestDate));
        return {
            ...route.baselineFilter.location,
            [`${this.mainDateField}From`]: dateRange.from,
            [`${this.mainDateField}To`]: dateRange.to,
            isRevocation: route.baselineFilter.isRevocation,
            versionStatus: route.baselineFilter.versionStatus,
        };
    };
}

export class WestNileAnalyzeSingleVariantView
    extends WestNileConstants
    implements View<AnalyzeSingleVariantRouteWithLatestVersion>
{
    public readonly pathname = `/${pathFragment}/single-variant`;
    public readonly label = 'Single variant';
    public readonly labelLong = 'Analyze a single variant';
    public readonly defaultRoute = {
        organism: Organisms.westNile as typeof Organisms.westNile,
        pathname: this.pathname,
        baselineFilter: {
            location: {},
            dateRange: this.defaultDateRange,
            versionStatus: 'LATEST_VERSION' as const,
            isRevocation: false as const,
        },
        variantFilter: {
            versionStatus: 'LATEST_VERSION' as const,
            isRevocation: false as const,
        },
    };

    public parseUrl = (url: URL): AnalyzeSingleVariantRouteWithLatestVersion => {
        const search = url.searchParams;
        return {
            organism: this.organism,
            pathname: this.pathname,
            baselineFilter: {
                location: getLapisLocationFromSearch(search, this.locationFields),
                dateRange: getDateRangeFromSearch(search, this.mainDateField) ?? this.defaultDateRange,
                versionStatus: 'LATEST_VERSION' as const,
                isRevocation: false as const,
            },
            variantFilter: {
                ...getLapisVariantQuery(search, this.lineageField),
                versionStatus: 'LATEST_VERSION' as const,
                isRevocation: false as const,
            },
        };
    };

    public toUrl = (route: AnalyzeSingleVariantRouteWithLatestVersion): string => {
        const search = new URLSearchParams();
        setSearchFromLocation(search, route.baselineFilter.location);
        if (route.baselineFilter.dateRange !== this.defaultDateRange) {
            setSearchFromDateRange(search, this.mainDateField, route.baselineFilter.dateRange);
        }
        setSearchFromLapisVariantQuery(search, route.variantFilter, this.lineageField);
        return `${this.pathname}?${search}`;
    };

    public toLapisFilter = (route: AnalyzeSingleVariantRouteWithLatestVersion) => {
        return {
            ...this.toLapisFilterWithoutVariant(route),
            ...route.variantFilter,
        };
    };
}

export class WestNileSequencingEffortsView
    extends WestNileConstants
    implements View<RouteWithBaselineWithLatestVersion>
{
    public pathname = `/${pathFragment}/sequencing-efforts`;
    public label = 'Sequencing efforts';
    public labelLong = 'Sequencing efforts';
    public readonly defaultRoute = {
        organism: Organisms.westNile as typeof Organisms.westNile,
        pathname: this.pathname,
        baselineFilter: {
            location: {},
            dateRange: this.defaultDateRange,
            versionStatus: 'LATEST_VERSION' as const,
            isRevocation: false as const,
        },
    };

    public parseUrl = (url: URL): RouteWithBaselineWithLatestVersion => {
        const search = url.searchParams;
        return {
            organism: this.organism,
            pathname: this.pathname,
            baselineFilter: {
                location: getLapisLocationFromSearch(search, this.locationFields),
                dateRange: getDateRangeFromSearch(search, this.mainDateField) ?? this.defaultDateRange,
                versionStatus: 'LATEST_VERSION' as const,
                isRevocation: false as const,
            },
        };
    };

    public toUrl = (route: RouteWithBaselineWithLatestVersion): string => {
        const search = new URLSearchParams();
        setSearchFromLocation(search, route.baselineFilter.location);
        if (route.baselineFilter.dateRange !== this.defaultDateRange) {
            setSearchFromDateRange(search, this.mainDateField, route.baselineFilter.dateRange);
        }
        return `${this.pathname}?${search}`;
    };

    public toLapisFilter = (route: RouteWithBaselineWithLatestVersion): LapisFilter => {
        return this.toLapisFilterWithoutVariant(route);
    };
}
