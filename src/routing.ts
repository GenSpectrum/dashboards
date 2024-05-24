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

export type View1Route = LapisFilter & {
    route: 'view1';
};

export type Route = View1Route;

export const getCurrentRouteInBrowser = (): Route | undefined => {
    return parseUrl(new URL(window.location.href));
};

export const parseUrl = (url: URL): Route | undefined => {
    const search = url.searchParams;
    let variantQuery: LapisSimpleVariantQuery | LapisAdvancedVariantQuery = {};
    const advancedVariantQuery = search.get('variantQuery');
    if (advancedVariantQuery) {
        variantQuery = { variantQuery: advancedVariantQuery };
    } else {
        variantQuery = {
            nextcladePangoLineage: search.get('nextcladePangoLineage') ?? undefined,
            nucleotideMutations: search.get('nucleotideMutations')?.split(',') ?? undefined,
            aminoAcidMutations: search.get('aminoAcidMutations')?.split(',') ?? undefined,
            nucleotideInsertions: search.get('nucleotideInsertions')?.split(',') ?? undefined,
            aminoAcidInsertions: search.get('aminoAcidInsertions')?.split(',') ?? undefined,
        };
    }
    return {
        route: 'view1',
        region: search.get('region') ?? undefined,
        country: search.get('country') ?? undefined,
        division: search.get('division') ?? undefined,
        ...variantQuery,
    };
};

export const toUrl = (route: Route): string => {
    const search = new URLSearchParams();
    if (route.region) {
        search.set('region', route.region);
    }
    if (route.country) {
        search.set('country', route.country);
    }
    if (route.division) {
        search.set('division', route.division);
    }
    if (isAdvancedVariantQuery(route)) {
        if (route.variantQuery) {
            search.set('variantQuery', route.variantQuery);
        }
    } else if (isSimpleVariantQuery(route)) {
        if (route.nextcladePangoLineage) {
            search.set('nextcladePangoLineage', route.nextcladePangoLineage);
        }
        if (route.nucleotideMutations && route.nucleotideMutations.length > 0) {
            search.set('nucleotideMutations', route.nucleotideMutations.join(','));
        }
        if (route.aminoAcidMutations && route.aminoAcidMutations.length > 0) {
            search.set('aminoAcidMutations', route.aminoAcidMutations.join(','));
        }
        if (route.nucleotideInsertions && route.nucleotideInsertions.length > 0) {
            search.set('nucleotideInsertions', route.nucleotideInsertions.join(','));
        }
        if (route.aminoAcidInsertions && route.aminoAcidInsertions.length > 0) {
            search.set('aminoAcidInsertions', route.aminoAcidInsertions.join(','));
        }
    }
    return `/?${search}`;
};

export const navigateTo = (route: Route) => {
    window.location.href = toUrl(route);
};

export const changeVariantQuery = (route: Route, variantQuery: VariantQuery): Route => {
    let newRoute = { ...route };
    if (isSimpleVariantQuery(newRoute)) {
        delete newRoute.nextcladePangoLineage;
        delete newRoute.nucleotideMutations;
        delete newRoute.aminoAcidMutations;
        delete newRoute.nucleotideInsertions;
        delete newRoute.aminoAcidInsertions;
    } else if (isAdvancedVariantQuery(newRoute)) {
        delete newRoute.variantQuery;
    }
    return {
        ...newRoute,
        ...variantQuery,
    };
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
