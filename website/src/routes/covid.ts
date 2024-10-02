import {
    type DateRange,
    type DateRangeOption,
    dateRangeToCustomDateRange,
    getDateRangeFromSearch,
    getIntegerFromSearch,
    getLapisCovidVariantQuery,
    getLapisLocationFromSearch,
    getTodayString,
    type LapisCovidVariantQuery,
    type LapisFilter,
    type LapisLocation,
    type LapisVariantQuery,
    setSearchFromDateRange,
    setSearchFromLapisCovidVariantQuery,
    setSearchFromLocation,
} from './helpers.ts';
import { type BaselineFilter, organismConfig, Organisms, type Route, type VariantFilter, type View } from './View.ts';
import { type OrganismsConfig } from '../config.ts';

const pathFragment = organismConfig[Organisms.covid].pathFragment;

const earliestDate = '2020-01-06';
const today = getTodayString();

class CovidConstants {
    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.covid.lapis.mainDateField;
        this.locationFields = organismsConfig.covid.lapis.locationFields;
        this.lineageField = organismsConfig.covid.lapis.lineageField;
        this.hostField = organismsConfig.covid.lapis.hostField;
        this.originatingLabField = organismsConfig.covid.lapis.originatingLabField;
        this.submittingLabField = organismsConfig.covid.lapis.submittingLabField;
    }

    public readonly organism = Organisms.covid as typeof Organisms.covid;
    public readonly defaultDateRange: DateRange = 'last6Months';
    public readonly earliestDate = '2020-01-06';
    public readonly customDateRangeOptions: DateRangeOption[] = [
        { label: '2024', dateFrom: '2024-01-01', dateTo: today },
        { label: '2023', dateFrom: '2023-01-02', dateTo: '2023-12-31' },
        { label: '2022', dateFrom: '2022-01-03', dateTo: '2023-01-01' },
        { label: '2021', dateFrom: '2024-01-04', dateTo: '2022-01-02' },
        { label: '2020', dateFrom: earliestDate, dateTo: '2021-01-03' },
    ];
    public readonly mainDateField: string;
    public readonly locationFields: string[];
    public readonly lineageField: string;
    public readonly hostField: string;
    public readonly originatingLabField: string | undefined;
    public readonly submittingLabField: string | undefined;

    public variantFilterToLapisFilter = (filter: LapisCovidVariantQuery): LapisFilter => {
        const lapisFilter: LapisFilter = {};
        for (const [key, value] of Object.entries(filter)) {
            if (key === 'lineage') {
                lapisFilter[this.lineageField] = value;
            } else {
                lapisFilter[key] = value;
            }
        }

        return lapisFilter;
    };
}

export type CovidAnalyzeSingleVariantRoute = Route &
    BaselineFilter & {
        variantFilter: LapisCovidVariantQuery;
        collectionId?: number;
    };

export class CovidAnalyzeSingleVariantView extends CovidConstants implements View<CovidAnalyzeSingleVariantRoute> {
    public readonly pathname = `/${pathFragment}/single-variant` as const;
    public readonly label = 'Single variant';
    public readonly labelLong = 'Analyze a single variant';
    public readonly defaultRoute = {
        organism: this.organism,
        pathname: this.pathname,
        baselineFilter: {
            location: {},
            dateRange: this.defaultDateRange,
        },
        variantFilter: { lineage: 'JN.1*' },
    };

    parseUrl = (url: URL): CovidAnalyzeSingleVariantRoute => {
        const search = url.searchParams;
        return {
            organism: this.organism,
            pathname: this.pathname,
            baselineFilter: {
                location: getLapisLocationFromSearch(search, this.locationFields),
                dateRange: getDateRangeFromSearch(search, this.mainDateField) ?? this.defaultDateRange,
            },
            variantFilter: getLapisCovidVariantQuery(search, this.lineageField),
            collectionId: getIntegerFromSearch(search, 'collectionId'),
        };
    };

    toUrl = (route: CovidAnalyzeSingleVariantRoute): string => {
        const search = new URLSearchParams();
        setSearchFromLocation(search, route.baselineFilter.location);

        if (route.baselineFilter.dateRange !== this.defaultDateRange) {
            setSearchFromDateRange(search, this.mainDateField, route.baselineFilter.dateRange);
        }

        setSearchFromLapisCovidVariantQuery(search, route.variantFilter, this.lineageField);

        if (route.collectionId !== undefined) {
            search.set('collectionId', route.collectionId.toString());
        }
        return `${this.pathname}?${search}`;
    };

    public toLapisFilter = (route: CovidAnalyzeSingleVariantRoute) => {
        return {
            ...this.toLapisFilterWithoutVariant(route),
            ...this.variantFilterToLapisFilter(route.variantFilter),
        };
    };

    public toLapisFilterWithoutVariant = (route: CovidAnalyzeSingleVariantRoute): LapisFilter => {
        const dateRange = dateRangeToCustomDateRange(route.baselineFilter.dateRange, new Date(earliestDate));
        return {
            ...route.baselineFilter.location,
            [`${this.mainDateField}From`]: dateRange.from,
            [`${this.mainDateField}To`]: dateRange.to,
        };
    };
}

export type CovidCompareVariantsRoute = {
    organism: typeof Organisms.covid;
    pathname: string;
    filters: Map<Id, CovidCompareVariantsFilter>;
};

type CovidCompareVariantsFilter = BaselineFilter & VariantFilter;

type Id = number;

function decodeMultipleFiltersFromSearch(search: URLSearchParams) {
    const filterMap = new Map<Id, Map<string, string>>();

    for (const [key, value] of search) {
        const keySplit = key.split('$');
        if (keySplit.length !== 2) {
            console.error(`Invalid key in URLSearchParam: ${key}`);
            return undefined;
        }
        const id = Number.parseInt(keySplit[1]);
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

function encodeMultipleFiltersToUrlSearchParam(filters: Map<Id, Map<string, string>>) {
    const search = new URLSearchParams();
    for (const [id, filter] of filters) {
        for (const [key, value] of filter) {
            search.append(`${key}$${id}`, value);
        }
    }
    return search;
}

export class CovidCompareVariantsView
    extends CovidConstants
    implements View<CovidCompareVariantsRoute, CovidCompareVariantsRoute | undefined>
{
    public readonly pathname = `/${pathFragment}/compare-side-by-side` as const;
    public readonly label = 'Compare side-by-side';
    public readonly labelLong = 'Compare variants side-by-side';

    public readonly defaultRoute = {
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
                        lineage: 'JN.1*',
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
                        lineage: 'XBB.1*',
                    },
                },
            ],
        ]),
    };

    private getFilter = (filterParams: Map<string, string>) => {
        const filter: BaselineFilter & VariantFilter = {
            baselineFilter: { location: {}, dateRange: this.defaultDateRange },
            variantFilter: {},
        };

        filter.baselineFilter.location = getLapisLocationFromSearch(filterParams, this.locationFields);
        filter.baselineFilter.dateRange =
            getDateRangeFromSearch(filterParams, this.mainDateField) ?? this.defaultDateRange;
        filter.variantFilter = getLapisCovidVariantQuery(filterParams, this.lineageField);

        return filter;
    };

    public parseUrl = (url: URL): CovidCompareVariantsRoute | undefined => {
        const filterPerColumn = decodeMultipleFiltersFromSearch(url.searchParams);
        if (filterPerColumn === undefined) {
            return undefined;
        }

        const filters = new Map<number, CovidCompareVariantsFilter>();
        for (const [columnId, filterParams] of filterPerColumn) {
            filters.set(columnId, this.getFilter(filterParams));
        }

        return {
            organism: this.organism,
            pathname: this.pathname,
            filters: filters,
        };
    };

    public toUrl = (route: CovidCompareVariantsRoute): string => {
        const searchParameterMap = new Map<Id, Map<string, string>>();

        for (const [columnId, filter] of route.filters) {
            searchParameterMap.set(columnId, new Map<string, string>());

            const searchOfFilter = new URLSearchParams();
            setSearchFromLapisCovidVariantQuery(searchOfFilter, filter.variantFilter, this.lineageField);
            setSearchFromLocation(searchOfFilter, filter.baselineFilter.location);
            setSearchFromDateRange(searchOfFilter, this.mainDateField, filter.baselineFilter.dateRange);

            searchOfFilter.forEach((value, key) => {
                searchParameterMap.get(columnId)?.set(key, value);
            });
        }

        const search = encodeMultipleFiltersToUrlSearchParam(searchParameterMap);

        return `${this.pathname}?${search}`;
    };

    public setFilter = (
        route: CovidCompareVariantsRoute,
        newFilter: CovidCompareVariantsFilter,
        columnId: Id,
    ): CovidCompareVariantsRoute => {
        const filtersPerColumn = new Map(route.filters);

        filtersPerColumn.set(columnId, newFilter);
        return {
            ...route,
            filters: filtersPerColumn,
        };
    };

    public addEmptyFilter = (route: CovidCompareVariantsRoute): CovidCompareVariantsRoute => {
        const lastId = Math.max(...Array.from(route.filters.keys()));

        return this.setFilter(
            route,
            {
                baselineFilter: {
                    location: {
                        region: 'Europe',
                    },
                    dateRange: this.defaultDateRange,
                },
                variantFilter: {},
            },
            lastId + 1,
        );
    };

    public removeFilter(route: CovidCompareVariantsRoute, columnId: number): CovidCompareVariantsRoute {
        const filters = new Map(route.filters);
        filters.delete(columnId);
        return {
            ...route,
            filters,
        };
    }

    public baselineFilterToLapisFilter = (filter: CovidCompareVariantsFilter['baselineFilter']): LapisFilter => {
        const dateRange = dateRangeToCustomDateRange(filter.dateRange, new Date(earliestDate));
        return {
            ...filter.location,
            [`${this.mainDateField}From`]: dateRange.from,
            [`${this.mainDateField}To`]: dateRange.to,
        };
    };
}

export type CovidSequencingEffortsRoute = Route &
    BaselineFilter & {
        collectionId?: number;
    };

export class CovidSequencingEffortsView extends CovidConstants implements View<CovidSequencingEffortsRoute> {
    public readonly pathname = `/${pathFragment}/sequencing-efforts` as const;
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

    public parseUrl = (url: URL): CovidSequencingEffortsRoute => {
        const search = url.searchParams;
        return {
            organism: this.organism,
            pathname: this.pathname,
            baselineFilter: {
                location: getLapisLocationFromSearch(search, this.locationFields),
                dateRange: getDateRangeFromSearch(search, this.mainDateField) ?? this.defaultDateRange,
            },
            collectionId: getIntegerFromSearch(search, 'collectionId'),
        };
    };

    toUrl = (route: CovidSequencingEffortsRoute): string => {
        const search = new URLSearchParams();
        setSearchFromLocation(search, route.baselineFilter.location);

        if (route.baselineFilter.dateRange !== this.defaultDateRange) {
            setSearchFromDateRange(search, this.mainDateField, route.baselineFilter.dateRange);
        }
        if (route.collectionId !== undefined) {
            search.set('collectionId', route.collectionId.toString());
        }
        return `${this.pathname}?${search}`;
    };

    toLapisFilter = (route: CovidSequencingEffortsRoute): LapisFilter => {
        const dateRange = dateRangeToCustomDateRange(route.baselineFilter.dateRange, new Date(earliestDate));
        return {
            ...route.baselineFilter.location,
            [`${this.mainDateField}From`]: dateRange.from,
            [`${this.mainDateField}To`]: dateRange.to,
        };
    };
}
