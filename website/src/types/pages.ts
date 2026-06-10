import type { Variant } from './Collection.ts';
import { organismConfig, paths, type Organism } from './Organism.ts';
import { advancedQueryUrlParamForVariant } from '../components/genspectrum/advancedQueryUrlParamConstants.ts';

export const Page = {
    apiKey: '/api-key',
    createSubscription: '/subscriptions/create',
    subscriptionsOverview: '/subscriptions',
    dataSources: '/data',
    collectionsOverview: '/collections',
    collectionsForOrganism: (organism: Organism) => `/collections/${organismConfig[organism].pathFragment}`,
    viewCollection: (organism: Organism, id: string) => `/collections/${organismConfig[organism].pathFragment}/${id}`,
    editCollection: (organism: Organism, id: string) =>
        `/collections/${organismConfig[organism].pathFragment}/${id}/edit`,
    createCollection: (organism: Organism) => `/collections/${organismConfig[organism].pathFragment}/create`,
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
