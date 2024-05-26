import {
    getStringArrayFromSearch,
    getStringFromSearch,
    setSearchFromString,
    setSearchFromStringArray,
} from './helpers.ts';

export namespace MpoxView1 {
    export const organism = 'mpox' as const;
    export const pathname = `/${organism}/single-variant` as const;
    export type Pathname = typeof pathname;

    export type Route = {
        organism: typeof organism;
        pathname: Pathname;
        baselineFilter: LapisLocation;
        variantFilter: LapisVariantQuery;
    };

    export const parseUrl = (url: URL): Route | undefined => {
        const search = url.searchParams;
        return {
            organism,
            pathname,
            baselineFilter: {
                geo_loc_country: getStringFromSearch(search, 'geo_loc_country'),
                geo_loc_admin_1: getStringFromSearch(search, 'geo_loc_admin_1'),
            },
            variantFilter: {
                clade: getStringFromSearch(search, 'clade'),
                lineage: getStringFromSearch(search, 'lineage'),
                nucleotideMutations: getStringArrayFromSearch(search, 'nucleotideMutations'),
                aminoAcidMutations: getStringArrayFromSearch(search, 'aminoAcidMutations'),
                nucleotideInsertions: getStringArrayFromSearch(search, 'nucleotideInsertions'),
                aminoAcidInsertions: getStringArrayFromSearch(search, 'aminoAcidInsertions'),
            },
        };
    };

    export const toUrl = (route: Route): string => {
        const search = new URLSearchParams();
        (['geo_loc_country', 'geo_loc_admin_1'] as const).forEach((field) =>
            setSearchFromString(search, field, route.baselineFilter[field]),
        );
        (['clade', 'lineage'] as const).forEach((field) =>
            setSearchFromString(search, field, route.variantFilter[field]),
        );
        (['nucleotideMutations', 'aminoAcidMutations', 'nucleotideInsertions', 'aminoAcidInsertions'] as const).forEach(
            (field) => setSearchFromStringArray(search, field, route.variantFilter[field]),
        );
        return `${pathname}?${search}`;
    };

    export type LapisLocation = {
        geo_loc_country?: string;
        geo_loc_admin_1?: string;
    };

    export type LapisVariantQuery = {
        clade?: string;
        lineage?: string;
        nucleotideMutations?: string[];
        aminoAcidMutations?: string[];
        nucleotideInsertions?: string[];
        aminoAcidInsertions?: string[];
    };
}
