import { type BaselineAndVariantData, type BaselineData, getLineageFilterFields, type View } from './View.ts';
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
import type { LineageFilterConfig } from '../components/pageStateSelectors/VariantSelector.tsx';
import { type OrganismsConfig } from '../config.ts';
import { organismConfig, Organisms } from '../types/Organism.ts';
import type { DataOrigin } from '../types/dataOrigins.ts';

const pathFragment = organismConfig[Organisms.mpox].pathFragment;

const earliestDate = '1960-01-01';

class MpoxConstants {
    public readonly organism = Organisms.mpox;
    public readonly earliestDate = '1960-01-01';
    public readonly defaultDateRange = { label: 'Since 2021', dateFrom: '2021-01-01' };
    public readonly dateRangeOptions = [
        { label: '2024', dateFrom: '2024-01-01' },
        { label: '2023', dateFrom: '2023-01-01', dateTo: '2023-12-31' },
        { label: '2022', dateFrom: '2022-01-01', dateTo: '2022-12-31' },
        { label: '2021', dateFrom: '2021-01-01', dateTo: '2021-12-31' },
        { label: 'Since 2021', dateFrom: '2021-01-01' },
        { label: 'Before 2021', dateFrom: earliestDate, dateTo: '2020-12-31' },
        { label: 'Since 2017', dateFrom: '2017-01-01' },
        { label: '2017-2020', dateFrom: '2017-01-01', dateTo: '2020-12-31' },
        { label: 'Before 2017', dateFrom: earliestDate, dateTo: '2016-12-31' },
    ];
    public readonly mainDateField: string;
    public readonly locationFields: string[];
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: 'lineage',
            placeholderText: 'Lineage',
            filterType: 'text' as const,
            initialValue: undefined,
        },
        {
            lapisField: 'clade',
            placeholderText: 'Clade',
            filterType: 'text' as const,
            initialValue: undefined,
        },
    ];
    public readonly hostField: string;
    public readonly authorsField: string | undefined;
    public readonly authorAffiliationsField: string | undefined;
    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = ['insdc'];

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.mpox.lapis.mainDateField;
        this.locationFields = organismsConfig.mpox.lapis.locationFields;
        this.hostField = organismsConfig.mpox.lapis.hostField;
        this.authorsField = organismsConfig.mpox.lapis.authorsField;
        this.authorAffiliationsField = organismsConfig.mpox.lapis.authorAffiliationsField;
        this.additionalFilters = organismsConfig.mpox.lapis.additionalFilters;
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

export class MpoxAnalyzeSingleVariantView extends MpoxConstants implements View<BaselineAndVariantData> {
    public readonly pathname = `/${pathFragment}/single-variant`;
    public readonly label = 'Single variant';
    public readonly labelLong = 'Analyze a single variant';
    public readonly defaultPageState: BaselineAndVariantData = {
        baselineFilter: {
            location: {},
            dateRange: this.defaultDateRange,
        },
        variantFilter: {
            mutations: {},
            lineages: {},
        },
    };

    public parsePageStateFromUrl(url: URL): BaselineAndVariantData {
        const search = url.searchParams;
        return {
            baselineFilter: {
                location: getLapisLocationFromSearch(search, this.locationFields),
                dateRange:
                    getDateRangeFromSearch(search, this.mainDateField, this.dateRangeOptions) ?? this.defaultDateRange,
            },
            variantFilter: {
                ...this.defaultPageState.variantFilter,
                ...getLapisVariantQuery(search, getLineageFilterFields(this.lineageFilters)),
            },
        };
    }

    public toUrl(pageState: BaselineAndVariantData): string {
        const search = new URLSearchParams();
        setSearchFromLocation(search, pageState.baselineFilter.location);
        if (pageState.baselineFilter.dateRange !== this.defaultDateRange) {
            setSearchFromDateRange(search, this.mainDateField, pageState.baselineFilter.dateRange);
        }
        setSearchFromLapisVariantQuery(search, pageState.variantFilter, getLineageFilterFields(this.lineageFilters));
        return `${this.pathname}?${search}`;
    }

    public toLapisFilter(pageState: BaselineAndVariantData) {
        return {
            ...this.toLapisFilterWithoutVariant(pageState),
            ...pageState.variantFilter.lineages,
            ...pageState.variantFilter.mutations,
        };
    }

    public getDefaultPageState() {
        return this.toUrl(this.defaultPageState);
    }
}

export class MpoxSequencingEffortsView extends MpoxConstants implements View<BaselineData> {
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

    public toLapisFilter(pageState: BaselineData): LapisFilter {
        return this.toLapisFilterWithoutVariant(pageState);
    }

    public getDefaultPageState() {
        return this.toUrl(this.defaultPageState);
    }
}
