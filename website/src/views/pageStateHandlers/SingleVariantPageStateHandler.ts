import type { LapisFilter } from '@genspectrum/dashboard-components/util';

import { paths } from '../../types/Organism.ts';
import type { OrganismConstants } from '../OrganismConstants.ts';
import { type DatasetAndVariantData, getLineageFilterFields } from '../View.ts';
import { singleVariantViewConstants } from '../ViewConstants.ts';
import {
    getLapisVariantQuery,
    getStringFromSearch,
    setSearchFromLapisVariantQuery,
    setSearchFromString,
} from '../helpers.ts';
import { type PageStateHandler, toLapisFilterWithVariant } from './PageStateHandler.ts';
import { parseDateRangesFromUrl, setSearchFromDateFilters } from './dateFilterFromToUrl.ts';
import { parseLocationFiltersFromUrl, setSearchFromLocationFilters } from './locationFilterFromToUrl.ts';
import { parseNumberRangeFilterFromUrl, setSearchFromNumberRangeFilters } from './numberRangeFilterFromToUrl.ts';
import { parseTextFiltersFromUrl, setSearchFromTextFilters } from './textFilterFromToUrl.ts';
import { toLapisFilterWithoutVariant } from './toLapisFilterWithoutVariant.ts';
import { advancedQueryUrlParam } from '../../components/genspectrum/AdvancedQueryFilter.tsx';
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
                numberFilters: parseNumberRangeFilterFromUrl(search, this.constants.baselineFilterConfigs),
                advancedQuery: getStringFromSearch(search, advancedQueryUrlParam),
            },
            variantFilter: getLapisVariantQuery(search, getLineageFilterFields(this.constants.lineageFilters)),
        };
    }

    public toUrl(pageState: DatasetAndVariantData): string {
        const search = new URLSearchParams();
        setSearchFromLocationFilters(search, pageState, this.constants.baselineFilterConfigs);
        setSearchFromDateFilters(search, pageState, this.constants.baselineFilterConfigs);
        setSearchFromTextFilters(search, pageState, this.constants.baselineFilterConfigs);
        setSearchFromNumberRangeFilters(search, pageState, this.constants.baselineFilterConfigs);
        setSearchFromString(search, advancedQueryUrlParam, pageState.datasetFilter.advancedQuery);

        setSearchFromLapisVariantQuery(
            search,
            pageState.variantFilter,
            getLineageFilterFields(this.constants.lineageFilters),
        );
        return formatUrl(this.pathname, search);
    }

    public toLapisFilter(pageState: DatasetAndVariantData) {
        return toLapisFilterWithVariant({
            datasetFilter: pageState.datasetFilter,
            variantFilter: pageState.variantFilter,
            additionalFilters: this.constants.additionalFilters,
        });
    }

    public toLapisFilterWithoutVariant(pageState: DatasetAndVariantData): LapisFilter {
        return toLapisFilterWithoutVariant(pageState.datasetFilter, this.constants.additionalFilters);
    }

    public getDefaultPageUrl() {
        return this.toUrl(this.defaultPageState);
    }
}
