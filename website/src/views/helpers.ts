import type { DateRangeOption } from '@genspectrum/dashboard-components';

import { CustomDateRangeLabel } from '../types/DateWindow.ts';

export type LapisFilter = Record<string, string | number | null | boolean | string[] | undefined>;

/**
 * Sets the value to the search params if the value is not empty, not undefined and not null
 */
export const setSearchFromString = (search: URLSearchParams, name: string, value: string | undefined | null) => {
    if (value !== null && value !== undefined && value !== '') {
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

export const lineageKey = 'lineage';
export const cladeKey = 'clade';

export type LapisVariantQuery = LapisMutationQuery & {
    [lineageKey]?: string;
    [cladeKey]?: string;
};

export type LapisCovidVariantQuery = LapisVariantQuery & {
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
    lineageIdentifier: string,
    cladeIdentifier?: string,
): LapisVariantQuery => {
    return {
        ...getLapisMutationsQueryFromSearch(search),
        [lineageKey]: getStringFromSearch(search, lineageIdentifier),
        [cladeKey]: cladeIdentifier !== undefined ? getStringFromSearch(search, cladeIdentifier) : undefined,
    };
};

export const setSearchFromLapisMutationsQuery = (search: URLSearchParams, query: LapisMutationQuery) => {
    (['nucleotideMutations', 'aminoAcidMutations', 'nucleotideInsertions', 'aminoAcidInsertions'] as const).forEach(
        (field) => setSearchFromStringArray(search, field, query[field]),
    );
};

export const setSearchFromLapisVariantQuery = (
    search: URLSearchParams,
    query: LapisCovidVariantQuery,
    lineageIdentifier: string,
    cladeIdentifier?: string,
) => {
    setSearchFromLapisMutationsQuery(search, query);
    setSearchFromString(search, lineageIdentifier, query.lineage);
    if (cladeIdentifier !== undefined) {
        setSearchFromString(search, cladeIdentifier, query.clade);
    }
};

export const getLapisCovidVariantQuery = (
    search: URLSearchParams | Map<string, string>,
    lineageIdentifier: string,
    cladeIdentifier?: string,
): LapisCovidVariantQuery => {
    const query = getLapisVariantQuery(search, lineageIdentifier, cladeIdentifier);
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
    query: LapisCovidVariantQuery,
    lineageIdentifier: string,
    cladeIdentifier?: string,
) => {
    setSearchFromLapisVariantQuery(search, query, lineageIdentifier, cladeIdentifier);
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
