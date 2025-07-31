import type { VariantFilter } from './View.ts';
import { advancedQueryUrlParamForVariant } from '../components/genspectrum/AdvancedQueryFilter.tsx';
import type { MutationFilter } from '../components/genspectrum/GsMutationFilter.tsx';

export const setSearchFromString = (
    search: URLSearchParams,
    name: string,
    value: string | undefined | null | string[],
) => {
    if (value !== null && value !== undefined && value !== '' && !Array.isArray(value)) {
        search.set(name, value);
    }
};

export const setSearchFromStringArray = (search: URLSearchParams, name: string, array: string[] | undefined | null) => {
    if (array && array.length > 0) {
        search.set(name, array.join(','));
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

export type LapisMutationQuery = {
    nucleotideMutations?: string[];
    aminoAcidMutations?: string[];
    nucleotideInsertions?: string[];
    aminoAcidInsertions?: string[];
};

export function getMutationFilter(mutationFilter: Partial<LapisMutationQuery>): MutationFilter {
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

    const advancedQuery = getStringFromSearch(search, advancedQueryUrlParamForVariant);

    return {
        mutations: { ...getLapisMutationsQueryFromSearch(search) },
        lineages: { ...lineageQuery },
        advancedQuery,
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
        setSearchFromString(search, advancedQueryUrlParamForVariant, query.advancedQuery);
    }
};
