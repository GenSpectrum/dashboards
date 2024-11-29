import type { DateRangeOption } from '@genspectrum/dashboard-components/util';

import type { VariantFilter } from './View.ts';
import type { MutationFilter } from '../components/genspectrum/GsMutationFilter.tsx';
import { CustomDateRangeLabel } from '../types/DateWindow.ts';

export type LapisFilter = Record<string, string | number | null | boolean | string[] | undefined>;

/**
 * Sets the value to the search params if the value is not empty, not undefined and not null
 */
export const setSearchFromString = (
    search: URLSearchParams,
    name: string,
    value: string | undefined | null | string[],
) => {
    if (value !== null && value !== undefined && value !== '' && Array.isArray(value) === false) {
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
            serializedValue = `${dateRange.dateFrom}--${dateRange.dateTo}`;
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
        nucleotideMutations: mutationFilter.nucleotideMutations || [],
        aminoAcidMutations: mutationFilter.aminoAcidMutations || [],
        nucleotideInsertions: mutationFilter.nucleotideInsertions || [],
        aminoAcidInsertions: mutationFilter.aminoAcidInsertions || [],
    };
}

export type LapisLineageQuery = {
    [lineage: string]: string | undefined;
};

export type LapisCovidVariantFilter = VariantFilter & {
    variantQuery?: string;
};

export const getLapisMutations = (query: LapisMutationQuery): LapisMutationQuery => {
    return {
        nucleotideMutations: getArrayPropertyOrEmpty(query, 'nucleotideMutations'),
        aminoAcidMutations: getArrayPropertyOrEmpty(query, 'aminoAcidMutations'),
        nucleotideInsertions: getArrayPropertyOrEmpty(query, 'nucleotideInsertions'),
        aminoAcidInsertions: getArrayPropertyOrEmpty(query, 'aminoAcidInsertions'),
    };
};

const getArrayPropertyOrEmpty = (query: LapisMutationQuery, name: keyof LapisMutationQuery): string[] => {
    return Array.isArray(query[name]) ? query[name] : [];
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
    query: LapisCovidVariantFilter,
    lineageFilters: string[],
) => {
    setSearchFromLapisMutationsQuery(search, query.mutations);

    lineageFilters.forEach((filter) => {
        setSearchFromString(search, filter, query.lineages[filter]);
    });
};

export const getLapisCovidVariantQuery = (
    search: URLSearchParams | Map<string, string>,
    lineageFilters: string[],
): LapisCovidVariantFilter => {
    const query = getLapisVariantQuery(search, lineageFilters);
    const variantQuery = getStringFromSearch(search, 'variantQuery');
    if (variantQuery !== undefined) {
        return {
            ...query,
            variantQuery,
        };
    }

    return {
        ...query,
    };
};

export const setSearchFromLapisCovidVariantQuery = (
    search: URLSearchParams,
    query: LapisCovidVariantFilter,
    lineageFilters: string[],
) => {
    setSearchFromLapisVariantQuery(search, query, lineageFilters);
    setSearchFromString(search, 'variantQuery', query.variantQuery);
};

export function getLocationSubdivision(locationFields: string[], locationFilter: LapisLocation) {
    if (locationFields.length <= 1) {
        return { label: '', field: undefined };
    }

    for (let i = locationFields.length - 1; i >= 0; i--) {
        const field = locationFields[i];

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- We need to check for undefined
        if (locationFilter[field] !== undefined) {
            const locationOneLevelUp = locationFields[i + 1];
            if (locationOneLevelUp) {
                return { label: getLocationLabel(locationOneLevelUp), field: locationOneLevelUp };
            }

            return { label: '', field: undefined };
        }
    }

    return {
        label: getLocationLabel(locationFields[0]),
        field: locationFields[0],
    };
}

function getLocationLabel(field: string) {
    if (field.toLowerCase().includes('country')) {
        return 'Country';
    }
    return 'Geographic sub-divisions';
}
