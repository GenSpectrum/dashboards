import type { DateRangeOption } from '@genspectrum/dashboard-components';

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
import type { OrganismsConfig } from '../config.ts';
import { organismConfig, Organisms } from '../types/Organism.ts';
import type { DataOrigin } from '../types/dataOrigins.ts';

const pathFragment = organismConfig[Organisms.h5n1].pathFragment;

const earliestDate = '1905-01-01';

class H5n1Constants {
    public readonly organism = Organisms.h5n1;
    public readonly earliestDate = '1905-01-01';
    public readonly defaultDateRange: DateRangeOption = { label: 'Since 2000', dateFrom: '2000-01-01' };
    public readonly dateRangeOptions = [
        { label: 'Since 2020', dateFrom: '2020-01-01' },
        { label: '2010-2019', dateFrom: '2010-01-01', dateTo: '2019-12-31' },
        { label: '2000-2009', dateFrom: '2000-01-01', dateTo: '2009-12-31' },
        { label: 'Since 2000', dateFrom: '2000-01-01' },
        { label: 'Before 2000', dateFrom: earliestDate, dateTo: '1999-12-31' },
    ];
    public readonly mainDateField: string;
    public readonly locationFields: string[];
    public readonly lineageFilters: LineageFilterConfig[] = [
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
        this.mainDateField = organismsConfig.h5n1.lapis.mainDateField;
        this.locationFields = organismsConfig.h5n1.lapis.locationFields;
        this.hostField = organismsConfig.h5n1.lapis.hostField;
        this.authorsField = organismsConfig.h5n1.lapis.authorsField;
        this.authorAffiliationsField = organismsConfig.h5n1.lapis.authorAffiliationsField;
        this.additionalFilters = organismsConfig.h5n1.lapis.additionalFilters;
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

export class H5n1AnalyzeSingleVariantView extends H5n1Constants implements View<BaselineAndVariantData> {
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
            variantFilter: getLapisVariantQuery(search, getLineageFilterFields(this.lineageFilters)),
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

    public toLapisFilter(pageState: BaselineAndVariantData): LapisFilter {
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

export class H5n1SequencingEffortsView extends H5n1Constants implements View<BaselineData> {
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
