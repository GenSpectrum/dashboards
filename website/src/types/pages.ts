import type { Variant } from './Collection.ts';
import { paths, type Organism } from './Organism.ts';
import { advancedQueryUrlParamForVariant } from '../components/genspectrum/AdvancedQueryFilter.tsx';

export const Page = {
    createSubscription: '/subscriptions/create',
    subscriptionsOverview: '/subscriptions',
    dataSources: '/data',
    collectionsOverview: '/collections',
    collectionsForOrganism: (organism: Organism) => `/collections/${organism}`,
    viewCollection: (organism: Organism, id: string) => `/collections/${organism}/${id}`,
    singleVariantView: (organism: Organism, variant: Variant) => {
        const basePath = paths[organism].basePath;
        const search = new URLSearchParams();
        if (variant.type === 'query') {
            search.set(advancedQueryUrlParamForVariant, variant.countQuery);
        } else {
            for (const [key, value] of Object.entries(variant.filterObject)) {
                if (Array.isArray(value)) {
                    if (value.length > 0) search.set(key, value.join(','));
                } else {
                    search.set(key, value);
                }
            }
        }
        const params = search.toString();
        return `${basePath}/single-variant${params ? `?${params}` : ''}`;
    },
} as const;
