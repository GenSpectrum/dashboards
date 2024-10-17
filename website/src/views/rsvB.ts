import { type BaselineAndVariantData, type BaselineData, type View } from './View.ts';
import {
    getDateRangeFromSearch,
    getLapisLocationFromSearch,
    getLapisVariantQuery,
    type LapisFilter,
    type LapisLocation,
    setSearchFromDateRange,
    setSearchFromLapisVariantQuery,
    setSearchFromLocation,
} from './helpers.ts';
import { type OrganismsConfig } from '../config.ts';
import { organismConfig, Organisms } from '../types/Organism.ts';
import type { DataOrigin } from '../types/dataOrigins.ts';

const pathFragment = organismConfig[Organisms.rsvB].pathFragment;

class RsvBConstants {
    public readonly organism = Organisms.rsvB;
    public readonly defaultDateRange = { label: 'Since 2020', dateFrom: '2020-01-01' };
    public readonly earliestDate = '1956-01-01';
    public readonly dateRangeOptions = [
        { label: 'Since 2020', dateFrom: '2020-01-01' },
        { label: '2010-2019', dateFrom: '2010-01-01', dateTo: '2019-12-31' },
        { label: '2000-2009', dateFrom: '2000-01-01', dateTo: '2009-12-31' },
        { label: 'Since 2000', dateFrom: '2000-01-01' },
        { label: 'Before 2000', dateFrom: this.earliestDate, dateTo: '1999-12-31' },
    ];
    public readonly mainDateField: string;
    public readonly locationFields: string[];
    public readonly lineageField: string;
    public readonly hostField: string;
    public readonly authorsField: string | undefined;
    public readonly authorAffiliationsField: string | undefined;
    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = ['insdc'];

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.rsvB.lapis.mainDateField;
        this.locationFields = organismsConfig.rsvB.lapis.locationFields;
        this.lineageField = organismsConfig.rsvB.lapis.lineageField;
        this.hostField = organismsConfig.rsvB.lapis.hostField;
        this.authorsField = organismsConfig.rsvB.lapis.authorsField;
        this.authorAffiliationsField = organismsConfig.rsvB.lapis.authorAffiliationsField;
        this.additionalFilters = organismsConfig.rsvB.lapis.additionalFilters;
    }

    public toLapisFilterWithoutVariant(pageState: BaselineData): LapisFilter & LapisLocation {
        return {
            ...pageState.baselineFilter.location,
            [`${this.mainDateField}From`]: pageState.baselineFilter.dateRange.dateFrom,
            [`${this.mainDateField}To`]: pageState.baselineFilter.dateRange.dateTo,
            ...this.additionalFilters,
        };
    }
}

export class RsvBAnalyzeSingleVariantView extends RsvBConstants implements View<BaselineAndVariantData> {
    public pathname = `/${pathFragment}/single-variant`;
    public label = 'Single variant';
    public labelLong = 'Analyze a single variant';
    public defaultPageState: BaselineAndVariantData = {
        baselineFilter: {
            location: {},
            dateRange: this.defaultDateRange,
        },
        variantFilter: {},
    };

    public parsePageStateFromUrl(url: URL): BaselineAndVariantData {
        const search = url.searchParams;
        return {
            baselineFilter: {
                location: getLapisLocationFromSearch(search, this.locationFields),
                dateRange:
                    getDateRangeFromSearch(search, this.mainDateField, this.dateRangeOptions) ?? this.defaultDateRange,
            },
            variantFilter: getLapisVariantQuery(search, this.lineageField),
        };
    }

    public toUrl(pageState: BaselineAndVariantData): string {
        const search = new URLSearchParams();
        setSearchFromLocation(search, pageState.baselineFilter.location);
        if (pageState.baselineFilter.dateRange !== this.defaultDateRange) {
            setSearchFromDateRange(search, this.mainDateField, pageState.baselineFilter.dateRange);
        }
        setSearchFromLapisVariantQuery(search, pageState.variantFilter, this.lineageField);
        return `${this.pathname}?${search}`;
    }

    public toLapisFilter(pageState: BaselineAndVariantData) {
        return {
            ...this.toLapisFilterWithoutVariant(pageState),
            ...pageState.variantFilter,
        };
    }

    public getDefaultPageState() {
        return this.toUrl(this.defaultPageState);
    }
}

export class RsvBSequencingEffortsView extends RsvBConstants implements View<BaselineData> {
    public readonly pathname = `/${pathFragment}/sequencing-efforts`;
    public readonly label = 'Sequencing efforts';
    public readonly labelLong = 'Sequencing efforts';
    public readonly defaultPageState: BaselineData = {
        baselineFilter: {
            location: {},
            dateRange: this.defaultDateRange,
        },
    };

    public parsePageStateFromUrl(url: URL): BaselineData {
        const search = url.searchParams;
        return {
            baselineFilter: {
                location: getLapisLocationFromSearch(search, this.locationFields),
                dateRange:
                    getDateRangeFromSearch(search, this.mainDateField, this.dateRangeOptions) ?? this.defaultDateRange,
            },
        };
    }

    public toUrl(pageState: BaselineData): string {
        const search = new URLSearchParams();
        setSearchFromLocation(search, pageState.baselineFilter.location);
        if (pageState.baselineFilter.dateRange !== this.defaultDateRange) {
            setSearchFromDateRange(search, this.mainDateField, pageState.baselineFilter.dateRange);
        }
        return `${this.pathname}?${search}`;
    }

    public toLapisFilter(pageState: BaselineData) {
        return this.toLapisFilterWithoutVariant(pageState);
    }

    public getDefaultPageState() {
        return this.toUrl(this.defaultPageState);
    }
}
