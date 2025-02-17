import type { LapisFilter } from '@genspectrum/dashboard-components/util';

import type { ExtendedConstants } from '../OrganismConstants.ts';
import { type CompareSideBySideData, type DatasetAndVariantData, getLineageFilterFields, type Id } from '../View.ts';
import { compareSideBySideViewConstants } from '../ViewConstants.ts';
import {
    getLapisLocationFromSearch,
    getLapisVariantQuery,
    setSearchFromLapisVariantQuery,
    setSearchFromLocation,
} from '../helpers.ts';
import {
    decodeFiltersFromSearch,
    type PageStateHandler,
    parseDateRangesFromUrl,
    parseTextFiltersFromUrl,
    searchParamsFromFilterMap,
    setSearchFromDateFilters,
    setSearchFromTextFilters,
    toLapisFilterWithoutVariant,
} from './PageStateHandler.ts';
import { formatUrl } from '../../util/formatUrl.ts';

export class CompareSideBySideStateHandler implements PageStateHandler<CompareSideBySideData> {
    protected readonly pathname;

    constructor(
        protected readonly constants: ExtendedConstants,
        protected readonly defaultPageState: CompareSideBySideData,
        pathFragment: string,
    ) {
        this.pathname = `/${pathFragment}/${compareSideBySideViewConstants.pathFragment}`;
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
        if (variantFilter.variantQuery) {
            return {
                variantQuery: variantFilter.variantQuery,
                ...toLapisFilterWithoutVariant({ datasetFilter }, this.constants.additionalFilters),
            };
        } else {
            return {
                ...variantFilter.lineages,
                ...variantFilter.mutations,
                ...toLapisFilterWithoutVariant({ datasetFilter }, this.constants.additionalFilters),
            };
        }
    }

    protected writeColumnDataToSearchParams(searchOfFilter: URLSearchParams, filter: DatasetAndVariantData): void {
        setSearchFromLapisVariantQuery(
            searchOfFilter,
            filter.variantFilter,
            getLineageFilterFields(this.constants.lineageFilters),
        );
        setSearchFromLocation(searchOfFilter, filter.datasetFilter.location);
        setSearchFromDateFilters(searchOfFilter, filter, this.constants.baselineFilterConfigs);
        setSearchFromTextFilters(searchOfFilter, filter, this.constants.baselineFilterConfigs);
    }

    protected getEmptyColumnData(): DatasetAndVariantData {
        return {
            datasetFilter: {
                location: {},
                textFilters: {},
                dateFilters: {},
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
                location: getLapisLocationFromSearch(filterParams, this.constants.locationFields),
                dateFilters: parseDateRangesFromUrl(filterParams, this.constants.baselineFilterConfigs),
                textFilters: parseTextFiltersFromUrl(filterParams, this.constants.baselineFilterConfigs),
            },
            variantFilter: getLapisVariantQuery(filterParams, getLineageFilterFields(this.constants.lineageFilters)),
        };
    }
}
