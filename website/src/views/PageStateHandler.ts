import type { SequencingEffortsConstants, SingleVariantConstants } from './OrganismConstants.ts';
import {
    type BaselineAndVariantData,
    type BaselineData,
    type CompareSideBySideData,
    getLineageFilterFields,
    type Id,
} from './View.ts';
import {
    compareSideBySideViewConstants,
    sequencingEffortsViewConstants,
    singleVariantViewConstants,
} from './ViewConstants.ts';
import type { CovidCompareSideBySideData } from './covid.ts';
import {
    getDateRangeFromSearch,
    getLapisLocationFromSearch,
    getLapisVariantQuery,
    type LapisFilter,
    type LapisLocation,
    setSearchFromDateRange,
    setSearchFromLapisVariantQuery,
    setSearchFromLocation,
} from './helpers.ts';
import { compareSideBySideViewKey } from './routing.ts';
import { UserFacingError } from '../components/ErrorReportInstruction.tsx';
import { organismConfig } from '../types/Organism.ts';

export interface PageStateHandler<PageState extends object> {
    parsePageStateFromUrl(url: URL): PageState;

    toUrl(pageState: PageState): string;

    getDefaultPageUrl(): string;
}

export class SequencingEffortsStateHandler implements PageStateHandler<BaselineData> {
    protected readonly pathname;

    constructor(
        protected readonly constants: SequencingEffortsConstants,
        protected readonly defaultPageState: BaselineData,
        pathFragment: string,
    ) {
        this.pathname = `/${pathFragment}/${sequencingEffortsViewConstants.pathFragment}`;
    }

    public parsePageStateFromUrl(url: URL): BaselineData {
        const search = url.searchParams;
        return {
            baselineFilter: {
                location: getLapisLocationFromSearch(search, this.constants.locationFields),
                dateRange:
                    getDateRangeFromSearch(search, this.constants.mainDateField, this.constants.dateRangeOptions) ??
                    this.constants.defaultDateRange,
            },
        };
    }

    public toUrl(pageState: BaselineData): string {
        const search = new URLSearchParams();
        setSearchFromLocation(search, pageState.baselineFilter.location);
        if (pageState.baselineFilter.dateRange !== this.constants.defaultDateRange) {
            setSearchFromDateRange(search, this.constants.mainDateField, pageState.baselineFilter.dateRange);
        }
        return `${this.pathname}?${search}`;
    }

    public getDefaultPageUrl(): string {
        return this.toUrl(this.defaultPageState);
    }

    public toLapisFilter(pageState: BaselineData) {
        return toLapisFilterWithoutVariant(pageState, this.constants);
    }
}

export class SingleVariantStateHandler<PageState extends BaselineAndVariantData = BaselineAndVariantData>
    implements PageStateHandler<BaselineAndVariantData>
{
    protected readonly pathname;

    constructor(
        protected readonly constants: SingleVariantConstants,
        protected readonly defaultPageState: PageState,
        pathFragment: string,
    ) {
        this.pathname = `/${pathFragment}/${singleVariantViewConstants.pathFragment}`;
    }

    public parsePageStateFromUrl(url: URL): BaselineAndVariantData {
        const search = url.searchParams;
        return {
            baselineFilter: {
                location: getLapisLocationFromSearch(search, this.constants.locationFields),
                dateRange:
                    getDateRangeFromSearch(search, this.constants.mainDateField, this.constants.dateRangeOptions) ??
                    this.constants.defaultDateRange,
            },
            variantFilter: getLapisVariantQuery(search, getLineageFilterFields(this.constants.lineageFilters)),
        };
    }

    public toUrl(pageState: BaselineAndVariantData): string {
        const search = new URLSearchParams();
        setSearchFromLocation(search, pageState.baselineFilter.location);
        if (pageState.baselineFilter.dateRange !== this.constants.defaultDateRange) {
            setSearchFromDateRange(search, this.constants.mainDateField, pageState.baselineFilter.dateRange);
        }
        setSearchFromLapisVariantQuery(
            search,
            pageState.variantFilter,
            getLineageFilterFields(this.constants.lineageFilters),
        );
        return `${this.pathname}?${search}`;
    }

    public toLapisFilter(pageState: BaselineAndVariantData) {
        return {
            ...toLapisFilterWithoutVariant(pageState, this.constants),
            ...pageState.variantFilter.lineages,
            ...pageState.variantFilter.mutations,
        };
    }

    public toLapisFilterWithoutVariant(pageState: BaselineData): LapisFilter & LapisLocation {
        return toLapisFilterWithoutVariant(pageState, this.constants);
    }

    public getDefaultPageUrl() {
        return this.toUrl(this.defaultPageState);
    }
}

function toLapisFilterWithoutVariant(
    pageState: BaselineData,
    constants: SequencingEffortsConstants,
): LapisFilter & LapisLocation {
    return {
        ...pageState.baselineFilter.location,
        [`${constants.mainDateField}From`]: pageState.baselineFilter.dateRange.dateFrom,
        [`${constants.mainDateField}To`]: pageState.baselineFilter.dateRange.dateTo,
        ...constants.additionalFilters,
    };
}

const $ = '$';

export abstract class CompareSideBySideStateHandler<ColumnData extends BaselineAndVariantData = BaselineAndVariantData>
    implements PageStateHandler<CompareSideBySideData<ColumnData>>
{
    protected readonly pathname;

    constructor(
        protected readonly constants: SingleVariantConstants,
        protected readonly defaultPageState: CompareSideBySideData<ColumnData>,
        pathFragment: string,
    ) {
        this.pathname = `/${pathFragment}/${compareSideBySideViewConstants.pathFragment}`;
    }

    public getDefaultPageUrl() {
        return this.toUrl(this.defaultPageState);
    }

    public parsePageStateFromUrl(url: URL): CompareSideBySideData<ColumnData> {
        const filterPerColumn = this.decodeMultipleFiltersFromSearch(url.searchParams);

        const filters = new Map<number, ColumnData>();
        for (const [columnId, filterParams] of filterPerColumn) {
            filters.set(columnId, this.getFilter(filterParams));
        }

        return {
            filters,
        };
    }

    public toUrl(pageState: CompareSideBySideData<ColumnData>): string {
        const searchParameterMap = new Map<Id, Map<string, string>>();

        for (const [columnId, filter] of pageState.filters) {
            searchParameterMap.set(columnId, new Map<string, string>());

            const searchOfFilter = new URLSearchParams();
            this.writeColumnDataToSearchParams(searchOfFilter, filter);

            searchOfFilter.forEach((value, key) => {
                searchParameterMap.get(columnId)?.set(key, value);
            });
        }

        const search = this.encodeMultipleFiltersToUrlSearchParam(searchParameterMap);

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

    public baselineFilterToLapisFilter(baselineFilter: ColumnData['baselineFilter']): LapisFilter {
        return toLapisFilterWithoutVariant({ baselineFilter }, this.constants);
    }

    private decodeMultipleFiltersFromSearch(search: URLSearchParams) {
        const filterMap = new Map<Id, Map<string, string>>();

        for (const [key, value] of search) {
            const keySplit = key.split($);
            if (keySplit.length !== 2) {
                throw new UserFacingError(
                    `Failed parsing query parameters on ${organismConfig[this.constants.organism].label} ${compareSideBySideViewKey}: Invalid key in URLSearchParam: '${key}'. Expected key of the form <parameter>${$}<id>`,
                );
            }
            const id = Number.parseInt(keySplit[1], 10);
            if (Number.isNaN(id)) {
                continue;
            }
            if (!filterMap.has(id)) {
                filterMap.set(id, new Map<string, string>());
            }
            const filter = filterMap.get(id)!;
            filter.set(keySplit[0], value);
        }
        return filterMap;
    }

    private encodeMultipleFiltersToUrlSearchParam(filters: Map<Id, Map<string, string>>) {
        const search = new URLSearchParams();
        for (const [id, filter] of filters) {
            for (const [key, value] of filter) {
                search.append(`${key}${$}${id}`, value);
            }
        }
        return search;
    }

    protected abstract writeColumnDataToSearchParams(searchOfFilter: URLSearchParams, filter: ColumnData): void;

    protected abstract getEmptyColumnData(): ColumnData;

    protected abstract getFilter(filterParams: Map<string, string>): ColumnData;
}

export class GenericCompareSideBySideStateHandler extends CompareSideBySideStateHandler {
    protected writeColumnDataToSearchParams(searchOfFilter: URLSearchParams, filter: BaselineAndVariantData): void {
        setSearchFromLapisVariantQuery(
            searchOfFilter,
            filter.variantFilter,
            getLineageFilterFields(this.constants.lineageFilters),
        );
        setSearchFromLocation(searchOfFilter, filter.baselineFilter.location);
        setSearchFromDateRange(searchOfFilter, this.constants.mainDateField, filter.baselineFilter.dateRange);
    }

    protected getEmptyColumnData(): BaselineAndVariantData {
        return {
            baselineFilter: {
                location: {},
                dateRange: this.constants.defaultDateRange,
            },
            variantFilter: {
                lineages: {},
                mutations: {},
            },
        };
    }

    protected getFilter(filterParams: Map<string, string>): BaselineAndVariantData {
        return {
            baselineFilter: {
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
}
