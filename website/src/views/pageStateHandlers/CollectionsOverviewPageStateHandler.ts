import type { PageStateHandler } from './PageStateHandler';
import { formatUrl } from '../../util/formatUrl';

export type CollectionFilter = 'community' | 'official' | 'all';

export type CollectionsOverviewPageState = {
    filter: CollectionFilter;
    tagFilter: string[];
};

const COLLECTION_FILTER_VALUES: CollectionFilter[] = ['community', 'official', 'all'];
const DEFAULT_FILTER: CollectionFilter = 'community';

export class CollectionsOverviewPageStateHandler implements PageStateHandler<CollectionsOverviewPageState> {
    constructor(private readonly path: string) {}

    parsePageStateFromUrl(url: URL): CollectionsOverviewPageState {
        const filterParam = url.searchParams.get('filter');
        const filter: CollectionFilter =
            filterParam !== null && (COLLECTION_FILTER_VALUES as string[]).includes(filterParam)
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
