import type { LapisFilter } from '@genspectrum/dashboard-components/util';

import type { ExtendedConstants } from '../OrganismConstants.ts';
import { type CompareSideBySideData, type DatasetAndVariantData, getLineageFilterFields, type Id } from '../View.ts';
import { compareSideBySideViewConstants } from '../ViewConstants.ts';
import type { CovidCompareSideBySideData } from '../covid.ts';
import {
    getDateRangeFromSearch,
    getLapisLocationFromSearch,
    getLapisVariantQuery,
    setSearchFromDateRange,
    setSearchFromLapisVariantQuery,
    setSearchFromLocation,
} from '../helpers.ts';
import {
    decodeFiltersFromSearch,
    type PageStateHandler,
    searchParamsFromFilterMap,
    toLapisFilterWithoutVariant,
} from './PageStateHandler.ts';

export abstract class CompareSideBySideStateHandler<ColumnData extends DatasetAndVariantData = DatasetAndVariantData>
    implements PageStateHandler<CompareSideBySideData<ColumnData>>
{
    protected readonly pathname;

    constructor(
        protected readonly constants: ExtendedConstants,
        protected readonly defaultPageState: CompareSideBySideData<ColumnData>,
        pathFragment: string,
    ) {
        this.pathname = `/${pathFragment}/${compareSideBySideViewConstants.pathFragment}`;
    }

    public getDefaultPageUrl() {
        return this.toUrl(this.defaultPageState);
    }

    public parsePageStateFromUrl(url: URL): CompareSideBySideData<ColumnData> {
        const filterPerColumn = decodeFiltersFromSearch(url.searchParams);

        const filters = new Map<number, ColumnData>();
        for (const [columnId, filterParams] of filterPerColumn) {
            filters.set(columnId, this.getFilter(filterParams));
        }

        return {
            filters,
        };
    }

    public toUrl(pageState: CompareSideBySideData<ColumnData>): string {
        const search = searchParamsFromFilterMap(pageState.filters, (search, variant) =>
            this.writeColumnDataToSearchParams(search, variant),
        );

        return `${this.pathname}?${search}`;
    }

    public setFilter(
        pageState: CompareSideBySideData<ColumnData>,
        newFilter: ColumnData,
        columnId: Id,
    ): CovidCompareSideBySideData {
        const filtersPerColumn = new Map(pageState.filters);

        filtersPerColumn.set(columnId, newFilter);
        return {
            filters: filtersPerColumn,
        };
    }

    public addEmptyFilter(pageState: CompareSideBySideData<ColumnData>): CovidCompareSideBySideData {
        const newId = pageState.filters.size === 0 ? 0 : Math.max(...Array.from(pageState.filters.keys())) + 1;

        return this.setFilter(pageState, this.getEmptyColumnData(), newId);
    }

    public removeFilter(pageState: CompareSideBySideData<ColumnData>, columnId: number): CovidCompareSideBySideData {
        const filters = new Map(pageState.filters);
        filters.delete(columnId);
        return {
            filters,
        };
    }

    public datasetFilterToLapisFilter(datasetFilter: ColumnData['datasetFilter']): LapisFilter {
        return toLapisFilterWithoutVariant({ datasetFilter }, this.constants);
    }

    public abstract variantFilterToLapisFilter(
        datasetFilter: ColumnData['datasetFilter'],
        variantFilter: ColumnData['variantFilter'],
    ): LapisFilter;

    protected abstract writeColumnDataToSearchParams(searchOfFilter: URLSearchParams, filter: ColumnData): void;

    protected abstract getEmptyColumnData(): ColumnData;

    protected abstract getFilter(filterParams: Map<string, string>): ColumnData;
}

export class GenericCompareSideBySideStateHandler extends CompareSideBySideStateHandler {
    protected writeColumnDataToSearchParams(searchOfFilter: URLSearchParams, filter: DatasetAndVariantData): void {
        setSearchFromLapisVariantQuery(
            searchOfFilter,
            filter.variantFilter,
            getLineageFilterFields(this.constants.lineageFilters),
        );
        setSearchFromLocation(searchOfFilter, filter.datasetFilter.location);
        setSearchFromDateRange(searchOfFilter, this.constants.mainDateField, filter.datasetFilter.dateRange);
    }

    protected getEmptyColumnData(): DatasetAndVariantData {
        return {
            datasetFilter: {
                location: {},
                dateRange: this.constants.defaultDateRange,
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
                dateRange:
                    getDateRangeFromSearch(
                        filterParams,
                        this.constants.mainDateField,
                        this.constants.dateRangeOptions,
                    ) ?? this.constants.defaultDateRange,
            },
            variantFilter: getLapisVariantQuery(filterParams, getLineageFilterFields(this.constants.lineageFilters)),
        };
    }

    public variantFilterToLapisFilter(
        datasetFilter: DatasetAndVariantData['datasetFilter'],
        variantFilter: DatasetAndVariantData['variantFilter'],
    ): LapisFilter {
        return {
            ...variantFilter.lineages,
            ...variantFilter.mutations,
            ...this.datasetFilterToLapisFilter(datasetFilter),
        };
    }
}
