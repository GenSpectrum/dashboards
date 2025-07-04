import type { LapisFilter } from '@genspectrum/dashboard-components/util';

import { paths } from '../../types/Organism.ts';
import type { OrganismConstants } from '../OrganismConstants.ts';
import { type CompareSideBySideData, type DatasetAndVariantData, getLineageFilterFields, type Id } from '../View.ts';
import { compareSideBySideViewConstants } from '../ViewConstants.ts';
import {
    getLapisVariantQuery,
    getStringFromSearch,
    setSearchFromLapisVariantQuery,
    setSearchFromString,
} from '../helpers.ts';
import { type PageStateHandler, toLapisFilterWithVariant } from './PageStateHandler.ts';
import { parseDateRangesFromUrl, setSearchFromDateFilters } from './dateFilterFromToUrl.ts';
import { parseLocationFiltersFromUrl, setSearchFromLocationFilters } from './locationFilterFromToUrl.ts';
import { decodeFiltersFromSearch, searchParamsFromFilterMap } from './multipleFiltersFromToUrl.ts';
import { parseNumberRangeFilterFromUrl, setSearchFromNumberRangeFilters } from './numberRangeFilterFromToUrl.ts';
import { parseTextFiltersFromUrl, setSearchFromTextFilters } from './textFilterFromToUrl.ts';
import { advancedQueryUrlParam } from '../../components/genspectrum/AdvancedQueryFilter.tsx';
import { formatUrl } from '../../util/formatUrl.ts';

export class CompareSideBySideStateHandler implements PageStateHandler<CompareSideBySideData> {
    protected readonly pathname;

    constructor(
        protected readonly constants: OrganismConstants,
        protected readonly defaultPageState: CompareSideBySideData,
    ) {
        this.pathname = `${paths[constants.organism].basePath}/${compareSideBySideViewConstants.pathFragment}`;
    }

    public getDefaultPageUrl() {
        return this.toUrl(this.defaultPageState);
    }

    public parsePageStateFromUrl(url: URL): CompareSideBySideData {
        const filterPerColumn = decodeFiltersFromSearch(url.searchParams);

        const filters = new Map<number, DatasetAndVariantData>();
        for (const [columnId, filterParams] of filterPerColumn) {
            filters.set(columnId, this.getFilter(filterParams));
        }

        return {
            filters,
        };
    }

    public toUrl(pageState: CompareSideBySideData): string {
        const search = searchParamsFromFilterMap(pageState.filters, (search, variant) =>
            this.writeColumnDataToSearchParams(search, variant),
        );

        return formatUrl(this.pathname, search);
    }

    public setFilter(
        pageState: CompareSideBySideData,
        newFilter: DatasetAndVariantData,
        columnId: Id,
    ): CompareSideBySideData {
        const filtersPerColumn = new Map(pageState.filters);

        filtersPerColumn.set(columnId, newFilter);
        return {
            filters: filtersPerColumn,
        };
    }

    public addEmptyFilter(pageState: CompareSideBySideData): CompareSideBySideData {
        const newId = pageState.filters.size === 0 ? 0 : Math.max(...Array.from(pageState.filters.keys())) + 1;

        return this.setFilter(pageState, this.getEmptyColumnData(), newId);
    }

    public removeFilter(pageState: CompareSideBySideData, columnId: number): CompareSideBySideData {
        const filters = new Map(pageState.filters);
        filters.delete(columnId);
        return {
            filters,
        };
    }

    public variantFilterToLapisFilter(
        datasetFilter: DatasetAndVariantData['datasetFilter'],
        variantFilter: DatasetAndVariantData['variantFilter'],
    ): LapisFilter {
        return toLapisFilterWithVariant({
            datasetFilter,
            variantFilter,
            additionalFilters: this.constants.additionalFilters,
        });
    }

    protected writeColumnDataToSearchParams(searchOfFilter: URLSearchParams, filter: DatasetAndVariantData): void {
        setSearchFromLapisVariantQuery(
            searchOfFilter,
            filter.variantFilter,
            getLineageFilterFields(this.constants.lineageFilters),
        );
        setSearchFromLocationFilters(searchOfFilter, filter, this.constants.baselineFilterConfigs);
        setSearchFromDateFilters(searchOfFilter, filter, this.constants.baselineFilterConfigs);
        setSearchFromTextFilters(searchOfFilter, filter, this.constants.baselineFilterConfigs);
        setSearchFromNumberRangeFilters(searchOfFilter, filter, this.constants.baselineFilterConfigs);
        setSearchFromString(searchOfFilter, advancedQueryUrlParam, filter.datasetFilter.advancedQuery);
    }

    protected getEmptyColumnData(): DatasetAndVariantData {
        return {
            datasetFilter: {
                locationFilters: {},
                textFilters: {},
                dateFilters: {},
                numberFilters: {},
            },
            variantFilter: {
                lineages: {},
                mutations: {},
            },
        };
    }

    protected getFilter(filterParams: Map<string, string>): DatasetAndVariantData {
        return {
            datasetFilter: {
                locationFilters: parseLocationFiltersFromUrl(filterParams, this.constants.baselineFilterConfigs),
                dateFilters: parseDateRangesFromUrl(filterParams, this.constants.baselineFilterConfigs),
                textFilters: parseTextFiltersFromUrl(filterParams, this.constants.baselineFilterConfigs),
                numberFilters: parseNumberRangeFilterFromUrl(filterParams, this.constants.baselineFilterConfigs),
                advancedQuery: getStringFromSearch(filterParams, advancedQueryUrlParam),
            },
            variantFilter: getLapisVariantQuery(filterParams, getLineageFilterFields(this.constants.lineageFilters)),
        };
    }
}
