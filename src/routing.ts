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

export type View1Route = {
    route: 'view1';
    collectionId?: number;
    baselineFilter: LapisLocation;
    variantFilter: VariantQuery;
};

export type Route = View1Route;

export const getCurrentRouteInBrowser = (): Route | undefined => {
    return parseUrl(new URL(window.location.href));
};

export const parseUrl = (url: URL): Route | undefined => {
    const search = url.searchParams;
    let variantFilter: LapisSimpleVariantQuery | LapisAdvancedVariantQuery = {};
    const advancedVariantQuery = search.get('variantQuery');
    if (advancedVariantQuery) {
        variantFilter = { variantQuery: advancedVariantQuery };
    } else {
        variantFilter = {
            nextcladePangoLineage: search.get('nextcladePangoLineage') ?? undefined,
            nucleotideMutations: search.get('nucleotideMutations')?.split(',') ?? undefined,
            aminoAcidMutations: search.get('aminoAcidMutations')?.split(',') ?? undefined,
            nucleotideInsertions: search.get('nucleotideInsertions')?.split(',') ?? undefined,
            aminoAcidInsertions: search.get('aminoAcidInsertions')?.split(',') ?? undefined,
        };
    }
    return {
        route: 'view1',
        baselineFilter: {
            region: search.get('region') ?? undefined,
            country: search.get('country') ?? undefined,
            division: search.get('division') ?? undefined,
        },
        variantFilter,
        collectionId:
            search.get('collectionId') !== null ? Number.parseInt(search.get('collectionId')!, 10) : undefined,
    };
};

export const toUrl = (route: Route): string => {
    const search = new URLSearchParams();
    if (route.baselineFilter.region) {
        search.set('region', route.baselineFilter.region);
    }
    if (route.baselineFilter.country) {
        search.set('country', route.baselineFilter.country);
    }
    if (route.baselineFilter.division) {
        search.set('division', route.baselineFilter.division);
    }
    const variantFilter = route.variantFilter;
    if (isAdvancedVariantQuery(variantFilter)) {
        if (variantFilter.variantQuery) {
            search.set('variantQuery', variantFilter.variantQuery);
        }
    } else if (isSimpleVariantQuery(variantFilter)) {
        if (variantFilter.nextcladePangoLineage) {
            search.set('nextcladePangoLineage', variantFilter.nextcladePangoLineage);
        }
        if (variantFilter.nucleotideMutations && variantFilter.nucleotideMutations.length > 0) {
            search.set('nucleotideMutations', variantFilter.nucleotideMutations.join(','));
        }
        if (variantFilter.aminoAcidMutations && variantFilter.aminoAcidMutations.length > 0) {
            search.set('aminoAcidMutations', variantFilter.aminoAcidMutations.join(','));
        }
        if (variantFilter.nucleotideInsertions && variantFilter.nucleotideInsertions.length > 0) {
            search.set('nucleotideInsertions', variantFilter.nucleotideInsertions.join(','));
        }
        if (variantFilter.aminoAcidInsertions && variantFilter.aminoAcidInsertions.length > 0) {
            search.set('aminoAcidInsertions', variantFilter.aminoAcidInsertions.join(','));
        }
    }
    if (route.collectionId !== undefined) {
        search.set('collectionId', route.collectionId.toString());
    }
    return `/?${search}`;
};

export const navigateTo = (route: Route) => {
    window.location.href = toUrl(route);
};

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
