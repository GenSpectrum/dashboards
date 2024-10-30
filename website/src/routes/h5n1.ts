import { type BaselineAndVariantData, type BaselineData, type View } from './View.ts';
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
import type { OrganismsConfig } from '../config.ts';
import { organismConfig, Organisms } from '../types/Organism.ts';

const pathFragment = organismConfig[Organisms.h5n1].pathFragment;

const earliestDate = '1905-01-01';
const today = getTodayString();

class H5n1Constants {
    public readonly organism = Organisms.h5n1;
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
    public readonly hostField: string;
    public readonly authorsField: string | undefined;
    public readonly authorAffiliationsField: string | undefined;
    public readonly additionalFilters: Record<string, string> | undefined;

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.h5n1.lapis.mainDateField;
        this.locationFields = organismsConfig.h5n1.lapis.locationFields;
        this.lineageField = organismsConfig.h5n1.lapis.lineageField;
        this.hostField = organismsConfig.h5n1.lapis.hostField;
        this.authorsField = organismsConfig.h5n1.lapis.authorsField;
        this.authorAffiliationsField = organismsConfig.h5n1.lapis.authorAffiliationsField;
        this.additionalFilters = organismsConfig.h5n1.lapis.additionalFilters;
    }

    public toLapisFilterWithoutVariant(route: BaselineData): LapisFilter {
        const dateRange = dateRangeToCustomDateRange(route.baselineFilter.dateRange, new Date(this.earliestDate));
        return {
            ...route.baselineFilter.location,
            [`${this.mainDateField}From`]: dateRange.from,
            [`${this.mainDateField}To`]: dateRange.to,
            ...this.additionalFilters,
        };
    }
}

export class H5n1AnalyzeSingleVariantView extends H5n1Constants implements View<BaselineAndVariantData> {
    public readonly pathname = `/${pathFragment}/single-variant`;
    public readonly label = 'Single variant';
    public readonly labelLong = 'Analyze a single variant';
    public readonly defaultPageData: BaselineAndVariantData = {
        baselineFilter: {
            location: {},
            dateRange: this.defaultDateRange,
        },
        variantFilter: {},
    };

    public parsePageDataFromUrl(url: URL): BaselineAndVariantData {
        const search = url.searchParams;
        return {
            baselineFilter: {
                location: getLapisLocationFromSearch(search, this.locationFields),
                dateRange: getDateRangeFromSearch(search, this.mainDateField) ?? this.defaultDateRange,
            },
            variantFilter: getLapisVariantQuery(search, this.lineageField),
        };
    }

    public toUrl(route: BaselineAndVariantData): string {
        const search = new URLSearchParams();
        setSearchFromLocation(search, route.baselineFilter.location);
        if (route.baselineFilter.dateRange !== this.defaultDateRange) {
            setSearchFromDateRange(search, this.mainDateField, route.baselineFilter.dateRange);
        }
        setSearchFromLapisVariantQuery(search, route.variantFilter, this.lineageField);
        return `${this.pathname}?${search}`;
    }

    public toLapisFilter(route: BaselineAndVariantData): LapisFilter {
        return {
            ...this.toLapisFilterWithoutVariant(route),
            ...route.variantFilter,
        };
    }

    public getDefaultPageData() {
        return this.toUrl(this.defaultPageData);
    }
}

export class H5n1SequencingEffortsView extends H5n1Constants implements View<BaselineData> {
    public readonly pathname = `/${pathFragment}/sequencing-efforts`;
    public readonly label = 'Sequencing efforts';
    public readonly labelLong = 'Sequencing efforts';
    public readonly defaultPageData: BaselineData = {
        baselineFilter: {
            location: {},
            dateRange: this.defaultDateRange,
        },
    };

    public parsePageDataFromUrl(url: URL): BaselineData {
        const search = url.searchParams;
        return {
            baselineFilter: {
                location: getLapisLocationFromSearch(search, this.locationFields),
                dateRange: getDateRangeFromSearch(search, this.mainDateField) ?? this.defaultDateRange,
            },
        };
    }

    public toUrl(route: BaselineData): string {
        const search = new URLSearchParams();
        setSearchFromLocation(search, route.baselineFilter.location);
        if (route.baselineFilter.dateRange !== this.defaultDateRange) {
            setSearchFromDateRange(search, this.mainDateField, route.baselineFilter.dateRange);
        }
        return `${this.pathname}?${search}`;
    }

    public toLapisFilter(route: BaselineData): LapisFilter {
        return this.toLapisFilterWithoutVariant(route);
    }

    public getDefaultPageData() {
        return this.toUrl(this.defaultPageData);
    }
}
