import { type BaselineAndVariantData, type BaselineData, type View } from './View.ts';
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
    public readonly additionalFilters: Record<string, string> | undefined;

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.mpox.lapis.mainDateField;
        this.locationFields = organismsConfig.mpox.lapis.locationFields;
        this.lineageField = organismsConfig.mpox.lapis.lineageField;
        this.hostField = organismsConfig.mpox.lapis.hostField;
        this.authorsField = organismsConfig.mpox.lapis.authorsField;
        this.authorAffiliationsField = organismsConfig.mpox.lapis.authorAffiliationsField;
        this.additionalFilters = organismsConfig.mpox.lapis.additionalFilters;
    }

    public toLapisFilterWithoutVariant(route: BaselineData): LapisFilter & LapisLocation {
        const dateRange = dateRangeToCustomDateRange(route.baselineFilter.dateRange, new Date(this.earliestDate));
        return {
            ...route.baselineFilter.location,
            [`${this.mainDateField}From`]: dateRange.from,
            [`${this.mainDateField}To`]: dateRange.to,
            ...this.additionalFilters,
        };
    }
}

export class MpoxAnalyzeSingleVariantView extends MpoxConstants implements View<BaselineAndVariantData> {
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
            variantFilter: getLapisVariantQuery(search, this.lineageField, this.cladeField),
        };
    }

    public toUrl(route: BaselineAndVariantData): string {
        const search = new URLSearchParams();
        setSearchFromLocation(search, route.baselineFilter.location);
        if (route.baselineFilter.dateRange !== this.defaultDateRange) {
            setSearchFromDateRange(search, this.mainDateField, route.baselineFilter.dateRange);
        }
        setSearchFromLapisVariantQuery(search, route.variantFilter, this.lineageField, this.cladeField);
        return `${this.pathname}?${search}`;
    }

    public toLapisFilter(route: BaselineAndVariantData) {
        return {
            ...this.toLapisFilterWithoutVariant(route),
            ...route.variantFilter,
        };
    }

    public getDefaultPageData() {
        return this.toUrl(this.defaultPageData);
    }
}

export class MpoxSequencingEffortsView extends MpoxConstants implements View<BaselineData> {
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
