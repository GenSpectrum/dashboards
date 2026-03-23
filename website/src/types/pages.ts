import type { Organism } from './Organism.ts';

export const Page = {
    createSubscription: '/subscriptions/create',
    subscriptionsOverview: '/subscriptions',
    dataSources: '/data',
    collectionsOverview: '/collections',
    collectionsForOrganism: (organism: Organism) => `/collections/${organism}`,
    viewCollection: (organism: Organism, id: string) => `/collections/${organism}/${id}`,
} as const;
