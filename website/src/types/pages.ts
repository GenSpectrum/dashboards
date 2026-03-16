export const Page = {
    createSubscription: '/subscriptions/create',
    subscriptionsOverview: '/subscriptions',
    dataSources: '/data',
    collectionsOverview: '/collections',
    collectionsForOrganism: (organism: string) => `/collections/${organism}`,
    createCollection: (organism: string) => `/collections/${organism}/create`,
    viewCollection: (organism: string, id: string) => `/collections/${organism}/${id}`,
    editCollection: (organism: string, id: string) => `/collections/${organism}/${id}/edit`,
} as const;
