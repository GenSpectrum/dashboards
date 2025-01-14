import type { DateRangeOption } from '@genspectrum/dashboard-components/util';

import type { VariantFilter } from './View.ts';
import type { MutationFilter } from '../components/genspectrum/GsMutationFilter.tsx';
import { CustomDateRangeLabel } from '../types/DateWindow.ts';

/**
 * Sets the value to the search params if the value is not empty, not undefined and not null
 */
export const setSearchFromString = (
    search: URLSearchParams,
    name: string,
    value: string | undefined | null | string[],
) => {
    if (value !== null && value !== undefined && value !== '' && !Array.isArray(value)) {
        search.set(name, value);
    }
};

/**
 * Sets the array to the search params via comma-separation if the array is not empty, not undefined and not null
 */
export const setSearchFromStringArray = (search: URLSearchParams, name: string, array: string[] | undefined | null) => {
    if (array && array.length > 0) {
        search.set(name, array.join(','));
    }
};

export const setSearchFromDateRange = (
    search: URLSearchParams,
    name: string,
    dateRange: DateRangeOption | undefined | null,
) => {
    if (dateRange !== null && dateRange !== undefined) {
        let serializedValue: string;
        if (dateRange.label === CustomDateRangeLabel) {
            serializedValue = `${dateRange.dateFrom ?? ''}--${dateRange.dateTo ?? ''}`;
        } else {
            serializedValue = dateRange.label;
        }
        search.set(name, serializedValue);
    }
};

export const getStringFromSearch = (
    search: URLSearchParams | Map<string, string>,
    name: string,
): string | undefined => {
    return search.get(name) ?? undefined;
};

export const getStringArrayFromSearch = (
    search: URLSearchParams | Map<string, string>,
    name: string,
): string[] | undefined => {
    return search.get(name)?.split(',') ?? undefined;
};

export const getIntegerFromSearch = (search: URLSearchParams, name: string): number | undefined => {
    const value = search.get(name);
    return value !== null ? Number.parseInt(value, 10) : undefined;
};

export const getDateRangeFromSearch = (
    search: URLSearchParams | Map<string, string>,
    name: string,
    dateRangeOptions: DateRangeOption[],
): DateRangeOption | undefined => {
    const value = search.get(name);
    if (value === null || value === undefined) {
        return undefined;
    }
    const customDateRange = dateRangeOptions.find((option) => option.label === value);
    if (customDateRange !== undefined) {
        return customDateRange;
    }

    if (value.includes('--')) {
        const split = value.split('--');
        return {
            label: CustomDateRangeLabel,
            dateFrom: split[0],
            dateTo: split[1],
        };
    }
    return undefined;
};

export type LapisLocation = Record<string, string | undefined>;

export const getLapisLocationFromSearch = (
    search: URLSearchParams | Map<string, string>,
    locationFields: string[],
): LapisLocation => {
    const location: Record<string, string> = {};
    locationFields.forEach((field) => {
        const value = getStringFromSearch(search, field);
        if (value !== undefined) {
            location[field] = value;
        }
    });
    return location;
};

export const setSearchFromLocation = (search: URLSearchParams, location: LapisLocation) => {
    Object.entries(location).forEach(([field, value]) => setSearchFromString(search, field, value));
};

export type LapisMutationQuery = {
    nucleotideMutations?: string[];
    aminoAcidMutations?: string[];
    nucleotideInsertions?: string[];
    aminoAcidInsertions?: string[];
};

export function getMutationFilter(mutationFilter: LapisMutationQuery): MutationFilter {
    return {
        nucleotideMutations: mutationFilter.nucleotideMutations ?? [],
        aminoAcidMutations: mutationFilter.aminoAcidMutations ?? [],
        nucleotideInsertions: mutationFilter.nucleotideInsertions ?? [],
        aminoAcidInsertions: mutationFilter.aminoAcidInsertions ?? [],
    };
}

export type LapisLineageQuery = {
    [lineage: string]: string | undefined;
};

export const getLapisMutationsQueryFromSearch = (search: URLSearchParams | Map<string, string>): LapisMutationQuery => {
    return {
        nucleotideMutations: getStringArrayFromSearch(search, 'nucleotideMutations'),
        aminoAcidMutations: getStringArrayFromSearch(search, 'aminoAcidMutations'),
        nucleotideInsertions: getStringArrayFromSearch(search, 'nucleotideInsertions'),
        aminoAcidInsertions: getStringArrayFromSearch(search, 'aminoAcidInsertions'),
    };
};

export const getLapisVariantQuery = (
    search: URLSearchParams | Map<string, string>,
    lineageFilters: string[],
): VariantFilter => {
    const variantQuery = search.get('variantQuery');
    if (variantQuery) {
        return { variantQuery };
    }

    const lineageQuery = lineageFilters
        .map((filter) => {
            const value = getStringFromSearch(search, filter);
            return { [filter]: value };
        })
        .reduce((acc, curr) => ({ ...acc, ...curr }), {});

    return {
        mutations: { ...getLapisMutationsQueryFromSearch(search) },
        lineages: { ...lineageQuery },
    };
};

export const setSearchFromLapisMutationsQuery = (search: URLSearchParams, query: LapisMutationQuery) => {
    (['nucleotideMutations', 'aminoAcidMutations', 'nucleotideInsertions', 'aminoAcidInsertions'] as const).forEach(
        (field) => setSearchFromStringArray(search, field, query[field]),
    );
};

export const setSearchFromLapisVariantQuery = (
    search: URLSearchParams,
    query: VariantFilter,
    lineageFilters: string[],
) => {
    if (query.variantQuery !== undefined) {
        setSearchFromString(search, 'variantQuery', query.variantQuery);
    } else {
        setSearchFromLapisMutationsQuery(search, query.mutations ?? {});

        lineageFilters.forEach((filter) => {
            if (query.lineages) {
                setSearchFromString(search, filter, query.lineages[filter]);
            }
        });
    }
};
