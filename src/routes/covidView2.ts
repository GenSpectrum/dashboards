import { CovidView1 } from './covidView1.ts';
import type { View } from './View.ts';

export namespace CovidView2 {
    export const organism = 'covid' as const;
    export const pathname = `/${organism}/compare-side-by-side` as const;
    export type Pathname = typeof pathname;

    export type Route = {
        organism: typeof organism;
        pathname: Pathname;
        filters: Filter[];
    };

    type Filter = {
        id: number;
        baselineFilter: CovidView1.LapisLocation;
        variantFilter: CovidView1.LapisVariantQuery;
    };

    export const parseUrl = (url: URL): Route | undefined => {
        const filterMap = new Map<number, Filter>();
        const search = url.searchParams;
        for (const [key, value] of search) {
            const keySplit = key.split('$');
            if (keySplit.length !== 2) {
                return undefined;
            }
            const field = keySplit[0];
            const id = Number.parseInt(keySplit[1]);
            if (Number.isNaN(id)) {
                return undefined;
            }
            if (!filterMap.has(id)) {
                filterMap.set(id, { id, baselineFilter: {}, variantFilter: {} });
            }
            const filter = filterMap.get(id)!;
            switch (field) {
                case 'region':
                case 'country':
                case 'division':
                    filter.baselineFilter[field] = value;
                    break;
                case 'variantQuery':
                    if (CovidView1.isSimpleVariantQuery(filter.variantFilter)) {
                        return undefined;
                    }
                    (filter.variantFilter as CovidView1.LapisAdvancedVariantQuery)[field] = value;
                    break;
                case 'nextcladePangoLineage':
                    if (CovidView1.isAdvancedVariantQuery(filter.variantFilter)) {
                        return undefined;
                    }
                    (filter.variantFilter as CovidView1.LapisSimpleVariantQuery)[field] = value;
                    break;
                case 'nucleotideMutations':
                case 'aminoAcidMutations':
                case 'nucleotideInsertions':
                case 'aminoAcidInsertions':
                    if (CovidView1.isAdvancedVariantQuery(filter.variantFilter)) {
                        return undefined;
                    }
                    (filter.variantFilter as CovidView1.LapisSimpleVariantQuery)[field] = value.split(',');
                    break;
                default:
                    return undefined;
            }
        }

        return {
            organism,
            pathname,
            filters: [...filterMap.values()].sort((a, b) => a.id - b.id),
        };
    };

    export const toUrl = (route: Route): string => {
        const search = new URLSearchParams();
        for (const filter of route.filters) {
            const id = filter.id;
            Object.entries(filter.baselineFilter).forEach(([key, value]) => {
                if (value !== undefined) {
                    search.append(`${key}$${id}`, value);
                }
            });
            Object.entries(filter.variantFilter).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    if (value.length > 0) {
                        search.append(`${key}$${id}`, value.join(','));
                    }
                } else {
                    if (value !== undefined && value.length > 0) {
                        search.append(`${key}$${id}`, value);
                    }
                }
            });
        }
        return `${pathname}?${search}`;
    };

    export const view: View<Route> = {
        organism,
        pathname,
        label: 'Compare side-by-side',
        parseUrl,
        toUrl,
        defaultRoute: {
            organism,
            pathname,
            filters: [
                { id: 1, baselineFilter: {}, variantFilter: { nextcladePangoLineage: 'JN.1*' } },
                { id: 2, baselineFilter: {}, variantFilter: { nextcladePangoLineage: 'XBB.1*' } },
            ],
        },
    };

    export const setFilter = (route: Route, newFilter: Filter): Route => {
        const newRoute = {
            ...route,
            filters: route.filters.filter((route) => route.id !== newFilter.id),
        };
        newRoute.filters.push(newFilter);
        return newRoute;
    };
}
