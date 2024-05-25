import { View1 } from './view1';

export namespace View2 {
    export const pathname = '/covid/compare-side-by-side';

    export type Route = {
        route: 'view2';
        filters: Filter[];
    };

    type Filter = {
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
            const index = Number.parseInt(keySplit[1]);
            if (Number.isNaN(index)) {
                return undefined;
            }
            if (!filterMap.has(index)) {
                filterMap.set(index, { baselineFilter: {}, variantFilter: {} });
            }
            const filter = filterMap.get(index)!;
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
            filters: [...filterMap.values()],
        };
    };

    export const toUrl = (route: Route): string => {
        const search = new URLSearchParams();
        route.filters.forEach((filter, index) => {
            Object.entries(filter.baselineFilter).forEach(([key, value]) => {
                search.append(`${key}$${index}`, value);
            });
            Object.entries(filter.variantFilter).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    search.append(`${key}$${index}`, value.join(','));
                } else {
                    search.append(`${key}$${index}`, value);
                }
            });
        });
        return `${pathname}?${search}`;
    };
}
