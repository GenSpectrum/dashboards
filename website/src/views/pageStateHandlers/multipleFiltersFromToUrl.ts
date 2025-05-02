import type { Id } from '../View.ts';

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
