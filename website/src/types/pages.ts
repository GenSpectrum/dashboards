import type { Variant } from './Collection.ts';
import { paths, type Organism } from './Organism.ts';
import { advancedQueryUrlParamForVariant } from '../components/genspectrum/advancedQueryUrlParamConstants.ts';

export const Page = {
    createSubscription: '/subscriptions/create',
    subscriptionsOverview: '/subscriptions',
    dataSources: '/data',
    collectionsOverview: '/collections',
    collectionsForOrganism: (organism: Organism) => `/collections/${organism}`,
    viewCollection: (organism: Organism, id: string) => `/collections/${organism}/${id}`,
    editCollection: (organism: Organism, id: string) => `/collections/${organism}/${id}/edit`,
    createCollection: (organism: Organism) => `/collections/${organism}/create`,
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
        return `${basePath}/single-variant?${search.toString()}`;
    },
} as const;
