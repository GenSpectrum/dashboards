import type { OrganismConstants } from '../OrganismConstants.ts';
import { type DatasetAndVariantData, getLineageFilterFields } from '../View.ts';
import { sequencingEffortsViewConstants } from '../ViewConstants.ts';
import {
    getLapisLocationFromSearch,
    getLapisVariantQuery,
    setSearchFromLapisVariantQuery,
    setSearchFromLocation,
} from '../helpers.ts';
import {
    type PageStateHandler,
    parseDateRangesFromUrl,
    parseTextFiltersFromUrl,
    setSearchFromDateFilters,
    setSearchFromTextFilters,
    toLapisFilterFromVariant,
    toLapisFilterWithoutVariant,
} from './PageStateHandler.ts';
import { formatUrl } from '../../util/formatUrl.ts';

export class SequencingEffortsStateHandler<PageState extends DatasetAndVariantData = DatasetAndVariantData>
    implements PageStateHandler<DatasetAndVariantData>
{
    protected readonly pathname;

    constructor(
        protected readonly constants: OrganismConstants,
        protected readonly defaultPageState: PageState,
        pathFragment: string,
    ) {
        this.pathname = `/${pathFragment}/${sequencingEffortsViewConstants.pathFragment}`;
    }

    public parsePageStateFromUrl(url: URL): DatasetAndVariantData {
        const search = url.searchParams;

        return {
            datasetFilter: {
                location: getLapisLocationFromSearch(search, this.constants.locationFields),
                dateFilters: parseDateRangesFromUrl(search, this.constants.baselineFilterConfigs),
                textFilters: parseTextFiltersFromUrl(search, this.constants.baselineFilterConfigs),
            },
            variantFilter: getLapisVariantQuery(search, getLineageFilterFields(this.constants.lineageFilters)),
        };
    }

    public toUrl(pageState: DatasetAndVariantData): string {
        const search = new URLSearchParams();
        setSearchFromLocation(search, pageState.datasetFilter.location);
        setSearchFromDateFilters(search, pageState, this.constants.baselineFilterConfigs);
        setSearchFromTextFilters(search, pageState, this.constants.baselineFilterConfigs);

        setSearchFromLapisVariantQuery(
            search,
            pageState.variantFilter,
            getLineageFilterFields(this.constants.lineageFilters),
        );
        return formatUrl(this.pathname, search);
    }

    public toLapisFilter(pageState: DatasetAndVariantData) {
        return {
            ...toLapisFilterWithoutVariant(pageState, this.constants.additionalFilters),
            ...toLapisFilterFromVariant(pageState.variantFilter),
        };
    }

    public getDefaultPageUrl(): string {
        return this.toUrl(this.defaultPageState);
    }
}
