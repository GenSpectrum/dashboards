import {
    getIntegerFromSearch,
    getStringArrayFromSearch,
    getStringFromSearch,
    setSearchFromString,
    setSearchFromStringArray,
} from './helpers.ts';

export namespace View1 {
    export const pathname = '/covid/single-variant';

    export type Route = {
        route: 'view1';
        collectionId?: number;
        baselineFilter: LapisLocation;
        variantFilter: VariantQuery;
    };

    export const parseUrl = (url: URL): Route | undefined => {
        const search = url.searchParams;
        let variantFilter: LapisSimpleVariantQuery | LapisAdvancedVariantQuery = {};
        const advancedVariantQuery = search.get('variantQuery');
        if (advancedVariantQuery) {
            variantFilter = { variantQuery: advancedVariantQuery };
        } else {
            variantFilter = {
                nextcladePangoLineage: getStringFromSearch(search, 'nextcladePangoLineage'),
                nucleotideMutations: getStringArrayFromSearch(search, 'nucleotideMutations'),
                aminoAcidMutations: getStringArrayFromSearch(search, 'aminoAcidMutations'),
                nucleotideInsertions: getStringArrayFromSearch(search, 'nucleotideInsertions'),
                aminoAcidInsertions: getStringArrayFromSearch(search, 'aminoAcidInsertions'),
            };
        }
        return {
            route: 'view1',
            baselineFilter: {
                region: getStringFromSearch(search, 'region'),
                country: getStringFromSearch(search, 'country'),
                division: getStringFromSearch(search, 'division'),
            },
            variantFilter,
            collectionId: getIntegerFromSearch(search, 'collectionId'),
        };
    };

    export const toUrl = (route: Route): string => {
        const search = new URLSearchParams();
        (['region', 'country', 'division'] as const).forEach((field) =>
            setSearchFromString(search, field, route.baselineFilter[field]),
        );
        const variantFilter = route.variantFilter;
        if (isAdvancedVariantQuery(variantFilter)) {
            setSearchFromString(search, 'variantQuery', variantFilter.variantQuery);
        } else if (isSimpleVariantQuery(variantFilter)) {
            setSearchFromString(search, 'nextcladePangoLineage', variantFilter.nextcladePangoLineage);
            (
                ['nucleotideMutations', 'aminoAcidMutations', 'nucleotideInsertions', 'aminoAcidInsertions'] as const
            ).forEach((field) => setSearchFromStringArray(search, field, variantFilter[field]));
        }
        if (route.collectionId !== undefined) {
            search.set('collectionId', route.collectionId.toString());
        }
        return `${pathname}?${search}`;
    };

    export type LapisLocation = {
        region?: string;
        country?: string;
        division?: string;
    };

    export type LapisSimpleVariantQuery = {
        nextcladePangoLineage?: string;
        nucleotideMutations?: string[];
        aminoAcidMutations?: string[];
        nucleotideInsertions?: string[];
        aminoAcidInsertions?: string[];
    };

    export type LapisAdvancedVariantQuery = {
        variantQuery?: string;
    };

    export type VariantQuery = LapisSimpleVariantQuery | LapisAdvancedVariantQuery;

    export type LapisFilter = LapisLocation & VariantQuery;

    const isSimpleVariantQuery = (variantQuery: VariantQuery): variantQuery is LapisSimpleVariantQuery => {
        return (
            'nucleotideMutations' in variantQuery ||
            'aminoAcidMutations' in variantQuery ||
            'nucleotideInsertions' in variantQuery ||
            'aminoAcidInsertions' in variantQuery ||
            'nextcladePangoLineage' in variantQuery
        );
    };

    const isAdvancedVariantQuery = (variantQuery: VariantQuery): variantQuery is LapisAdvancedVariantQuery => {
        return 'variantQuery' in variantQuery;
    };
}
