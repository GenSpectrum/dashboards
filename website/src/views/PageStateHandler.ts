import type { SequencingEffortsConstants, SingleVariantConstants } from './OrganismConstants.ts';
import { type BaselineAndVariantData, type BaselineData, getLineageFilterFields } from './View.ts';
import { sequencingEffortsViewConstants, singleVariantViewConstants } from './ViewConstants.ts';
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
