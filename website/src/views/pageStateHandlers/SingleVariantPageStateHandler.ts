import type { LapisFilter } from '@genspectrum/dashboard-components/util';

import { paths } from '../../types/Organism.ts';
import type { OrganismConstants } from '../OrganismConstants.ts';
import { type DatasetAndVariantData, getLineageFilterFields } from '../View.ts';
import { singleVariantViewConstants } from '../ViewConstants.ts';
import { getLapisVariantQuery, type LapisLocation, setSearchFromLapisVariantQuery } from '../helpers.ts';
import {
    type PageStateHandler,
    parseDateRangesFromUrl,
    parseLocationFiltersFromUrl,
    parseTextFiltersFromUrl,
    setSearchFromDateFilters,
    setSearchFromLocationFilters,
    setSearchFromTextFilters,
    toLapisFilterFromVariant,
    toLapisFilterWithoutVariant,
} from './PageStateHandler.ts';
import { formatUrl } from '../../util/formatUrl.ts';

export class SingleVariantPageStateHandler<PageState extends DatasetAndVariantData = DatasetAndVariantData>
    implements PageStateHandler<DatasetAndVariantData>
{
    protected readonly pathname;

    constructor(
        protected readonly constants: OrganismConstants,
        protected readonly defaultPageState: PageState,
    ) {
        this.pathname = `${paths[constants.organism].basePath}/${singleVariantViewConstants.pathFragment}`;
    }

    public parsePageStateFromUrl(url: URL): DatasetAndVariantData {
        const search = url.searchParams;

        return {
            datasetFilter: {
                locationFilters: parseLocationFiltersFromUrl(search, this.constants.baselineFilterConfigs),
                dateFilters: parseDateRangesFromUrl(search, this.constants.baselineFilterConfigs),
                textFilters: parseTextFiltersFromUrl(search, this.constants.baselineFilterConfigs),
            },
            variantFilter: getLapisVariantQuery(search, getLineageFilterFields(this.constants.lineageFilters)),
        };
    }

    public toUrl(pageState: DatasetAndVariantData): string {
        const search = new URLSearchParams();
        setSearchFromLocationFilters(search, pageState, this.constants.baselineFilterConfigs);
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

    public toLapisFilterWithoutVariant(pageState: DatasetAndVariantData): LapisFilter & LapisLocation {
        return toLapisFilterWithoutVariant(pageState, this.constants.additionalFilters);
    }

    public getDefaultPageUrl() {
        return this.toUrl(this.defaultPageState);
    }
}
