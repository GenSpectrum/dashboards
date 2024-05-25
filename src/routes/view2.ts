import { View1 } from './view1';

export namespace View2 {
    export const pathname = '/covid/compare-side-by-side';

    export type Route = {
        route: 'view2';
        filters: Filter[];
    };

    type Filter = {
        id: number;
        baselineFilter: View1.LapisLocation;
        variantFilter: View1.LapisVariantQuery;
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
                    if (View1.isSimpleVariantQuery(filter.variantFilter)) {
                        return undefined;
                    }
                    (filter.variantFilter as View1.LapisAdvancedVariantQuery)[field] = value;
                    break;
                case 'nextcladePangoLineage':
                    if (View1.isAdvancedVariantQuery(filter.variantFilter)) {
                        return undefined;
                    }
                    (filter.variantFilter as View1.LapisSimpleVariantQuery)[field] = value;
                    break;
                case 'nucleotideMutations':
                case 'aminoAcidMutations':
                case 'nucleotideInsertions':
                case 'aminoAcidInsertions':
                    if (View1.isAdvancedVariantQuery(filter.variantFilter)) {
                        return undefined;
                    }
                    (filter.variantFilter as View1.LapisSimpleVariantQuery)[field] = value.split(',');
                    break;
                default:
                    return undefined;
            }
        }

        return {
            route: 'view2',
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

    export const setFilter = (route: Route, newFilter: Filter): Route => {
        const newRoute = {
            ...route,
            filters: route.filters.filter((route) => route.id !== newFilter.id),
        };
        newRoute.filters.push(newFilter);
        return newRoute;
    };
}
