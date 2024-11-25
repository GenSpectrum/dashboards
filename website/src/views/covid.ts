import { type DateRangeOption, dateRangeOptionPresets } from '@genspectrum/dashboard-components/util';

import { type BaselineData, getLineageFilterFields, type VariantData, type View } from './View.ts';
import {
    getDateRangeFromSearch,
    getIntegerFromSearch,
    getLapisCovidVariantQuery,
    getLapisLocationFromSearch,
    type LapisCovidVariantFilter,
    type LapisFilter,
    setSearchFromDateRange,
    setSearchFromLapisCovidVariantQuery,
    setSearchFromLocation,
} from './helpers.ts';
import { type OrganismsConfig } from '../config.ts';
import { compareVariantsViewKey } from './routing.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/VariantSelector.tsx';
import { organismConfig, Organisms } from '../types/Organism.ts';
import type { DataOrigin } from '../types/dataOrigins.ts';
import type { InstanceLogger } from '../types/logMessage.ts';

const pathFragment = organismConfig[Organisms.covid].pathFragment;

const earliestDate = '2020-01-06';

class CovidConstants {
    public readonly organism = Organisms.covid;
    public readonly defaultDateRange = dateRangeOptionPresets.lastYear;
    public readonly earliestDate = '2020-01-06';
    public readonly dateRangeOptions: DateRangeOption[] = [
        dateRangeOptionPresets.lastMonth,
        dateRangeOptionPresets.last2Months,
        dateRangeOptionPresets.last3Months,
        dateRangeOptionPresets.last6Months,
        dateRangeOptionPresets.lastYear,
        { label: '2024', dateFrom: '2024-01-01', dateTo: '2024-12-31' },
        { label: '2023', dateFrom: '2023-01-02', dateTo: '2023-12-31' },
        { label: '2022', dateFrom: '2022-01-03', dateTo: '2023-01-01' },
        { label: '2021', dateFrom: '2021-01-04', dateTo: '2022-01-02' },
        { label: '2020', dateFrom: earliestDate, dateTo: '2021-01-03' },
        { label: 'All times', dateFrom: this.earliestDate },
    ];
    public readonly mainDateField: string;
    public readonly locationFields: string[];
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: 'nextcladePangoLineage',
            placeholderText: 'Nextclade pango lineage',
            filterType: 'lineage' as const,
            initialValue: undefined,
        },
    ];
    public readonly hostField: string;
    public readonly originatingLabField: string | undefined;
    public readonly submittingLabField: string | undefined;
    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = ['nextstrain'];

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.covid.lapis.mainDateField;
        this.locationFields = organismsConfig.covid.lapis.locationFields;
        this.hostField = organismsConfig.covid.lapis.hostField;
        this.originatingLabField = organismsConfig.covid.lapis.originatingLabField;
        this.submittingLabField = organismsConfig.covid.lapis.submittingLabField;
        this.additionalFilters = organismsConfig.covid.lapis.additionalFilters;
    }

    public variantFilterToLapisFilter(filter: LapisCovidVariantFilter): LapisFilter {
        return {
            ...filter.lineages,
            ...filter.mutations,
            variantQuery: filter.variantQuery,
        };
    }
}

export type CovidAnalyzeSingleVariantData = BaselineData &
    VariantData<LapisCovidVariantFilter> & {
        collectionId?: number;
    };

export class CovidAnalyzeSingleVariantView extends CovidConstants implements View<CovidAnalyzeSingleVariantData> {
    public readonly pathname = `/${pathFragment}/single-variant` as const;
    public readonly label = 'Single variant';
    public readonly labelLong = 'Analyze a single variant';
    public readonly iconType = 'magnify';

    public readonly defaultPageState: CovidAnalyzeSingleVariantData = {
        baselineFilter: {
            location: {},
            dateRange: this.defaultDateRange,
        },
        variantFilter: {
            lineages: {},
            mutations: {},
            variantQuery: undefined,
        },
    };

    public parsePageStateFromUrl(url: URL): CovidAnalyzeSingleVariantData {
        const search = url.searchParams;
        return {
            baselineFilter: {
                location: getLapisLocationFromSearch(search, this.locationFields),
                dateRange:
                    getDateRangeFromSearch(search, this.mainDateField, this.dateRangeOptions) ?? this.defaultDateRange,
            },
            variantFilter: getLapisCovidVariantQuery(search, getLineageFilterFields(this.lineageFilters)),
            collectionId: getIntegerFromSearch(search, 'collectionId'),
        };
    }

    public toUrl(pageState: CovidAnalyzeSingleVariantData): string {
        const search = new URLSearchParams();
        setSearchFromLocation(search, pageState.baselineFilter.location);

        if (pageState.baselineFilter.dateRange !== this.defaultDateRange) {
            setSearchFromDateRange(search, this.mainDateField, pageState.baselineFilter.dateRange);
        }

        setSearchFromLapisCovidVariantQuery(
            search,
            pageState.variantFilter,
            getLineageFilterFields(this.lineageFilters),
        );
        if (pageState.collectionId !== undefined) {
            search.set('collectionId', pageState.collectionId.toString());
        }
        return `${this.pathname}?${search}`;
    }

    public toLapisFilter(pageState: CovidAnalyzeSingleVariantData) {
        return {
            ...this.toLapisFilterWithoutVariant(pageState),
            ...this.variantFilterToLapisFilter(pageState.variantFilter),
        };
    }

    public toLapisFilterWithoutVariant(pageState: CovidAnalyzeSingleVariantData): LapisFilter {
        return {
            ...pageState.baselineFilter.location,
            [`${this.mainDateField}From`]: pageState.baselineFilter.dateRange.dateFrom,
            [`${this.mainDateField}To`]: pageState.baselineFilter.dateRange.dateTo,
            ...this.additionalFilters,
        };
    }

    public getDefaultPageUrl() {
        return this.toUrl(this.defaultPageState);
    }
}

export type CovidCompareVariantsData = {
    filters: Map<Id, CovidCompareVariantsFilter>;
};

type CovidCompareVariantsFilter = BaselineData & VariantData<LapisCovidVariantFilter>;

type Id = number;

export class CovidCompareVariantsView extends CovidConstants implements View<CovidCompareVariantsData> {
    public readonly pathname = `/${pathFragment}/compare-side-by-side` as const;
    public readonly label = 'Compare side-by-side';
    public readonly labelLong = 'Compare variants side-by-side';
    public readonly iconType = 'compare';

    public readonly defaultPageState = {
        organism: this.organism,
        pathname: this.pathname,
        filters: new Map<Id, CovidCompareVariantsFilter>([
            [
                0,
                {
                    baselineFilter: {
                        location: {},
                        dateRange: this.defaultDateRange,
                    },
                    variantFilter: {
                        lineages: {
                            nextcladePangoLineage: 'JN.1*',
                        },
                        mutations: {},
                        variantQuery: undefined,
                    },
                },
            ],
            [
                1,
                {
                    baselineFilter: {
                        location: {},
                        dateRange: this.defaultDateRange,
                    },
                    variantFilter: {
                        lineages: {
                            nextcladePangoLineage: 'XBB.1*',
                        },
                        mutations: {},
                        variantQuery: undefined,
                    },
                },
            ],
        ]),
    };

    constructor(
        organismsConfig: OrganismsConfig,
        private readonly logger: InstanceLogger,
    ) {
        super(organismsConfig);
    }

    public getDefaultPageUrl() {
        return this.toUrl(this.defaultPageState);
    }

    public parsePageStateFromUrl(url: URL): CovidCompareVariantsData {
        const filterPerColumn = this.decodeMultipleFiltersFromSearch(url.searchParams);

        const filters = new Map<number, CovidCompareVariantsFilter>();
        for (const [columnId, filterParams] of filterPerColumn) {
            filters.set(columnId, this.getFilter(filterParams));
        }

        return {
            filters,
        };
    }

    public toUrl(pageState: CovidCompareVariantsData): string {
        const searchParameterMap = new Map<Id, Map<string, string>>();

        for (const [columnId, filter] of pageState.filters) {
            searchParameterMap.set(columnId, new Map<string, string>());

            const searchOfFilter = new URLSearchParams();
            setSearchFromLapisCovidVariantQuery(
                searchOfFilter,
                filter.variantFilter,
                getLineageFilterFields(this.lineageFilters),
            );
            setSearchFromLocation(searchOfFilter, filter.baselineFilter.location);
            setSearchFromDateRange(searchOfFilter, this.mainDateField, filter.baselineFilter.dateRange);

            searchOfFilter.forEach((value, key) => {
                searchParameterMap.get(columnId)?.set(key, value);
            });
        }

        const search = this.encodeMultipleFiltersToUrlSearchParam(searchParameterMap);

        return `${this.pathname}?${search}`;
    }

    public setFilter(
        pageState: CovidCompareVariantsData,
        newFilter: CovidCompareVariantsFilter,
        columnId: Id,
    ): CovidCompareVariantsData {
        const filtersPerColumn = new Map(pageState.filters);

        filtersPerColumn.set(columnId, newFilter);
        return {
            ...pageState,
            filters: filtersPerColumn,
        };
    }

    public addEmptyFilter(pageState: CovidCompareVariantsData): CovidCompareVariantsData {
        const lastId = Math.max(...Array.from(pageState.filters.keys()));

        return this.setFilter(
            pageState,
            {
                baselineFilter: {
                    location: {
                        region: 'Europe',
                    },
                    dateRange: this.defaultDateRange,
                },
                variantFilter: {
                    lineages: {},
                    mutations: {},
                },
            },
            lastId + 1,
        );
    }

    public removeFilter(pageState: CovidCompareVariantsData, columnId: number): CovidCompareVariantsData {
        const filters = new Map(pageState.filters);
        filters.delete(columnId);
        return {
            ...pageState,
            filters,
        };
    }

    public baselineFilterToLapisFilter(filter: CovidCompareVariantsFilter['baselineFilter']): LapisFilter {
        return {
            ...filter.location,
            [`${this.mainDateField}From`]: filter.dateRange.dateFrom,
            [`${this.mainDateField}To`]: filter.dateRange.dateTo,
            ...this.additionalFilters,
        };
    }

    private decodeMultipleFiltersFromSearch(search: URLSearchParams) {
        const filterMap = new Map<Id, Map<string, string>>();

        for (const [key, value] of search) {
            const keySplit = key.split('$');
            if (keySplit.length !== 2) {
                throw Error(
                    `Failed parsing query parameters on ${Organisms.covid} ${compareVariantsViewKey}: Invalid key in URLSearchParam: ${key}`,
                );
            }
            const id = Number.parseInt(keySplit[1], 10);
            if (Number.isNaN(id)) {
                continue;
            }
            if (!filterMap.has(id)) {
                filterMap.set(id, new Map<string, string>());
            }
            const filter = filterMap.get(id)!;
            filter.set(keySplit[0], value);
        }
        return filterMap;
    }

    private encodeMultipleFiltersToUrlSearchParam(filters: Map<Id, Map<string, string>>) {
        const search = new URLSearchParams();
        for (const [id, filter] of filters) {
            for (const [key, value] of filter) {
                search.append(`${key}$${id}`, value);
            }
        }
        return search;
    }

    private getFilter(filterParams: Map<string, string>) {
        const filter: BaselineData & VariantData = {
            baselineFilter: {
                location: getLapisLocationFromSearch(filterParams, this.locationFields),
                dateRange:
                    getDateRangeFromSearch(filterParams, this.mainDateField, this.dateRangeOptions) ??
                    this.defaultDateRange,
            },
            variantFilter: getLapisCovidVariantQuery(filterParams, getLineageFilterFields(this.lineageFilters)),
        };

        return filter;
    }
}

export type CovidSequencingEffortsData = BaselineData & {
    collectionId?: number;
};

export class CovidSequencingEffortsView extends CovidConstants implements View<CovidSequencingEffortsData> {
    public readonly pathname = `/${pathFragment}/sequencing-efforts` as const;
    public readonly label = 'Sequencing efforts';
    public readonly labelLong = 'Sequencing efforts';

    public readonly defaultPageState: CovidSequencingEffortsData = {
        baselineFilter: {
            location: {},
            dateRange: this.defaultDateRange,
        },
    };
    public readonly iconType = 'tube';

    public parsePageStateFromUrl(url: URL): CovidSequencingEffortsData {
        const search = url.searchParams;
        return {
            baselineFilter: {
                location: getLapisLocationFromSearch(search, this.locationFields),
                dateRange:
                    getDateRangeFromSearch(search, this.mainDateField, this.dateRangeOptions) ?? this.defaultDateRange,
            },
            collectionId: getIntegerFromSearch(search, 'collectionId'),
        };
    }

    public toUrl(pageState: CovidSequencingEffortsData): string {
        const search = new URLSearchParams();
        setSearchFromLocation(search, pageState.baselineFilter.location);

        if (pageState.baselineFilter.dateRange !== this.defaultDateRange) {
            setSearchFromDateRange(search, this.mainDateField, pageState.baselineFilter.dateRange);
        }
        if (pageState.collectionId !== undefined) {
            search.set('collectionId', pageState.collectionId.toString());
        }
        return `${this.pathname}?${search}`;
    }

    public toLapisFilter(pageState: CovidSequencingEffortsData): LapisFilter {
        return {
            ...pageState.baselineFilter.location,
            [`${this.mainDateField}From`]: pageState.baselineFilter.dateRange.dateFrom,
            [`${this.mainDateField}To`]: pageState.baselineFilter.dateRange.dateTo,
            ...this.additionalFilters,
        };
    }

    public getDefaultPageUrl() {
        return this.toUrl(this.defaultPageState);
    }
}
