import type { DateRangeOption, LapisFilter } from '@genspectrum/dashboard-components/util';

import type { BaselineFilterConfig } from '../../components/pageStateSelectors/BaselineSelector.tsx';
import { type Dataset, type Id, type VariantFilter } from '../View.ts';
import {
    getDateRangeFromSearch,
    getStringFromSearch,
    type LapisLocation,
    setSearchFromDateRange,
    setSearchFromString,
} from '../helpers.ts';

export interface PageStateHandler<PageState extends object> {
    parsePageStateFromUrl(url: URL): PageState;

    toUrl(pageState: PageState): string;

    getDefaultPageUrl(): string;
}

export function toLapisFilterWithoutVariant(
    pageState: Dataset,
    additionalFilters: Record<string, string> | undefined,
): LapisFilter & LapisLocation {
    const dateFilters = Object.entries(pageState.datasetFilter.dateFilters).reduce(
        (acc, [lapisField, dateRange]) => {
            if (dateRange === undefined) {
                return acc;
            }

            return {
                ...acc,
                [`${lapisField}From`]: dateRange.dateFrom,
                [`${lapisField}To`]: dateRange.dateTo,
            };
        },
        {} as { [key: string]: string | undefined },
    );

    const textFilters = Object.entries(pageState.datasetFilter.textFilters).reduce(
        (acc, [lapisField, text]) => {
            if (text === undefined) {
                return acc;
            }

            return {
                ...acc,
                [lapisField]: text,
            };
        },
        {} as { [key: string]: string | undefined },
    );

    return {
        ...pageState.datasetFilter.location,
        ...dateFilters,
        ...textFilters,
        ...additionalFilters,
    };
}

export function toLapisFilterFromVariant(variantFilter: VariantFilter) {
    if (variantFilter.variantQuery) {
        return { variantQuery: variantFilter.variantQuery };
    } else {
        return {
            ...variantFilter.lineages,
            ...variantFilter.mutations,
        };
    }
}

export function parseDateRangesFromUrl(
    search: URLSearchParams | Map<string, string>,
    baselineFilterConfigs: BaselineFilterConfig[] | undefined,
) {
    const dateRangeFilterConfigs = baselineFilterConfigs?.filter((config) => config.type === 'date');

    return (
        dateRangeFilterConfigs?.reduce(
            (acc, config) => {
                const dateRange =
                    getDateRangeFromSearch(search, config.dateColumn, config.dateRangeOptions) ??
                    config.defaultDateRange;
                return {
                    ...acc,
                    [config.dateColumn]: dateRange,
                };
            },
            {} as {
                [key: string]: DateRangeOption | undefined;
            },
        ) ?? {}
    );
}

export function parseTextFiltersFromUrl(
    search: URLSearchParams | Map<string, string>,
    baselineFilterConfigs: BaselineFilterConfig[] | undefined,
) {
    const textFilterConfigs = baselineFilterConfigs?.filter((config) => config.type === 'text');

    return (
        textFilterConfigs?.reduce(
            (acc, config) => {
                return {
                    ...acc,
                    [config.lapisField]: getStringFromSearch(search, config.lapisField),
                };
            },
            {} as {
                [key: string]: string | undefined;
            },
        ) ?? {}
    );
}

export function setSearchFromDateFilters(
    search: URLSearchParams,
    pageState: Dataset,
    baselineFilterConfigs: BaselineFilterConfig[] | undefined,
) {
    const dateRangeFilterConfigs = baselineFilterConfigs?.filter((config) => config.type === 'date');

    dateRangeFilterConfigs?.forEach((config) => {
        const value = pageState.datasetFilter.dateFilters[config.dateColumn];
        setSearchFromDateRange(search, config.dateColumn, value);
    });
}

export function setSearchFromTextFilters(
    search: URLSearchParams,
    pageState: Dataset,
    baselineFilterConfigs: BaselineFilterConfig[] | undefined,
) {
    const textFilterConfigs = baselineFilterConfigs?.filter((config) => config.type === 'text');

    textFilterConfigs?.forEach((config) => {
        const value = pageState.datasetFilter.textFilters[config.lapisField];
        setSearchFromString(search, config.lapisField, value);
    });
}

const variantFilterUrlDelimiter = '$';
const columnsKey = 'columns';

export function decodeFiltersFromSearch(search: URLSearchParams) {
    const filterMap = new Map<Id, Map<string, string>>();

    const numFilters = Number.parseInt(search.get(columnsKey) ?? '0', 10);

    for (let id = 0; id < numFilters; id++) {
        filterMap.set(id, new Map<string, string>());
    }

    for (const [key, value] of search) {
        const keySplit = key.split(variantFilterUrlDelimiter);
        if (keySplit.length !== 2) {
            continue;
        }
        const id = Number.parseInt(keySplit[1], 10);
        if (Number.isNaN(id) || id > numFilters) {
            continue;
        }

        const filter = filterMap.get(id);

        if (filter === undefined) {
            continue;
        }

        filter.set(keySplit[0], value);
    }

    return filterMap;
}

export function encodeMultipleFiltersToUrlSearchParam(filters: Map<Id, Map<string, string>>) {
    const search = new URLSearchParams();
    if (filters.size > 0) {
        search.append(columnsKey, `${filters.size}`);
    }

    filters
        .entries()
        .toArray()
        .toSorted(([id1], [id2]) => id1 - id2)
        .forEach(([_, filter], index) => {
            for (const [key, value] of filter) {
                search.append(`${key}${variantFilterUrlDelimiter}${index}`, value);
            }
        });

    return search;
}

export function searchParamsFromFilterMap<Entry>(
    filterMap: Map<Id, Entry>,
    mapEntryToSearchParams: (search: URLSearchParams, entry: Entry) => void,
) {
    const searchParameterMap = new Map<Id, Map<string, string>>();

    for (const [variantId, filter] of filterMap) {
        searchParameterMap.set(variantId, new Map<string, string>());

        const searchOfFilter = new URLSearchParams();
        mapEntryToSearchParams(searchOfFilter, filter);

        searchOfFilter.forEach((value, key) => {
            searchParameterMap.get(variantId)?.set(key, value);
        });
    }

    return encodeMultipleFiltersToUrlSearchParam(searchParameterMap);
}

export function toDisplayName(variantFilter: VariantFilter) {
    if (variantFilter.variantQuery) {
        return variantFilter.variantQuery;
    }

    const lineages = variantFilter.lineages
        ? Object.values(variantFilter.lineages).filter((lineage) => lineage !== undefined)
        : [];

    return [
        ...lineages,
        ...(variantFilter.mutations?.nucleotideMutations ?? []),
        ...(variantFilter.mutations?.aminoAcidMutations ?? []),
        ...(variantFilter.mutations?.nucleotideInsertions ?? []),
        ...(variantFilter.mutations?.aminoAcidInsertions ?? []),
    ].join(' + ');
}
