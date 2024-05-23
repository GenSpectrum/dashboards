export type LapisLocation = {
    region?: string;
    country?: string;
    division?: string;
};

export type LapisNextcladePangoLineage = {
    nextcladePangoLineage?: string;
};

export type LapisFilter = LapisLocation & LapisNextcladePangoLineage;

export type View1Route = LapisFilter & {
    route: 'view1';
};

export type Route = View1Route;

export const getCurrentRouteInBrowser = (): Route | undefined => {
    return parseUrl(new URL(window.location.href));
};

export const parseUrl = (url: URL): Route | undefined => {
    const search = url.searchParams;
    return {
        route: 'view1',
        region: search.get('region') ?? undefined,
        country: search.get('country') ?? undefined,
        division: search.get('division') ?? undefined,
        nextcladePangoLineage: search.get('nextcladePangoLineage') ?? undefined,
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
    if (route.nextcladePangoLineage) {
        search.set('nextcladePangoLineage', route.nextcladePangoLineage);
    }
    return `/?${search}`;
};

export const navigateTo = (route: Route) => {
    window.location.href = toUrl(route);
};
