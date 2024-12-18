import type { LapisFilter } from '@genspectrum/dashboard-components/util';

import type { ExtendedConstants } from '../OrganismConstants.ts';
import { type Dataset, type Id } from '../View.ts';
import { type LapisCovidVariantFilter, type LapisLocation } from '../helpers.ts';

export interface PageStateHandler<PageState extends object> {
    parsePageStateFromUrl(url: URL): PageState;

    toUrl(pageState: PageState): string;

    getDefaultPageUrl(): string;
}

export function toLapisFilterWithoutVariant(
    pageState: Dataset,
    constants: ExtendedConstants,
): LapisFilter & LapisLocation {
    return {
        ...pageState.datasetFilter.location,
        [`${constants.mainDateField}From`]: pageState.datasetFilter.dateRange.dateFrom,
        [`${constants.mainDateField}To`]: pageState.datasetFilter.dateRange.dateTo,
        ...constants.additionalFilters,
    };
}

const variantFilterUrlDelimiter = '$';

export function decodeFiltersFromSearch(search: URLSearchParams) {
    const filterMap = new Map<Id, Map<string, string>>();

    for (const [key, value] of search) {
        const keySplit = key.split(variantFilterUrlDelimiter);
        if (keySplit.length !== 2) {
            continue;
        }
        const id = Number.parseInt(keySplit[1], 10);
        if (Number.isNaN(id)) {
            continue;
        }

        let filter = filterMap.get(id);

        if (filter === undefined) {
            filter = new Map<string, string>();
            filterMap.set(id, filter);
        }

        filter.set(keySplit[0], value);
    }
    return filterMap;
}

export function encodeMultipleFiltersToUrlSearchParam(filters: Map<Id, Map<string, string>>) {
    const search = new URLSearchParams();
    for (const [id, filter] of filters) {
        for (const [key, value] of filter) {
            search.append(`${key}${variantFilterUrlDelimiter}${id}`, value);
        }
    }
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

export function toDisplayName(variantFilter: LapisCovidVariantFilter) {
    return [
        ...Object.values(variantFilter.lineages).filter((lineage) => lineage !== undefined),
        ...(variantFilter.mutations.nucleotideMutations ?? []),
        ...(variantFilter.mutations.aminoAcidMutations ?? []),
        ...(variantFilter.mutations.nucleotideInsertions ?? []),
        ...(variantFilter.mutations.aminoAcidInsertions ?? []),
        ...(variantFilter.variantQuery !== undefined ? [variantFilter.variantQuery] : []),
    ].join(' + ');
}
