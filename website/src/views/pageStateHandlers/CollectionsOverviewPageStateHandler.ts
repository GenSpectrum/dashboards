import type { PageStateHandler } from './PageStateHandler';
import { formatUrl } from '../../util/formatUrl';

export const CollectionFilters = {
    community: 'community' as const,
    official: 'official' as const,
    all: 'all' as const,
};

export type CollectionFilter = keyof typeof CollectionFilters;

export type CollectionsOverviewPageState = {
    filter: CollectionFilter;
    tagFilter: string[];
};

const DEFAULT_FILTER: CollectionFilter = CollectionFilters.community;

export class CollectionsOverviewPageStateHandler implements PageStateHandler<CollectionsOverviewPageState> {
    constructor(private readonly path: string) {}

    parsePageStateFromUrl(url: URL): CollectionsOverviewPageState {
        const filterParam = url.searchParams.get('filter');
        const filterValues = Object.values(CollectionFilters) as string[];
        const filter: CollectionFilter =
            filterParam !== null && filterValues.includes(filterParam)
                ? (filterParam as CollectionFilter)
                : DEFAULT_FILTER;
        const tagFilter = url.searchParams.getAll('tag');
        return { filter, tagFilter };
    }

    toUrl(pageState: CollectionsOverviewPageState): string {
        const search = new URLSearchParams();
        if (pageState.filter !== DEFAULT_FILTER) {
            search.set('filter', pageState.filter);
        }
        for (const tag of pageState.tagFilter) {
            search.append('tag', tag);
        }
        return formatUrl(this.path, search);
    }

    getDefaultPageUrl(): string {
        return this.path;
    }
}
