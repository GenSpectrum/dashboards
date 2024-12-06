import type { SingleVariantConstants } from '../OrganismConstants.ts';
import {
    type CompareToBaselineData,
    type DatasetFilter,
    getLineageFilterConfigs,
    getLineageFilterFields,
    type Id,
    type VariantFilter,
} from '../View.ts';
import { compareToBaselineViewConstants } from '../ViewConstants.ts';
import {
    getDateRangeFromSearch,
    getLapisLocationFromSearch,
    getLapisVariantQuery,
    type LapisFilter,
    setSearchFromDateRange,
    setSearchFromLapisVariantQuery,
    setSearchFromLocation,
} from '../helpers.ts';
import {
    decodeFiltersFromSearch,
    type NamedLapisFilter,
    type PageStateHandler,
    searchParamsFromFilterMap,
    toDisplayName,
    toLapisFilterWithoutVariant,
} from './PageStateHandler.ts';
import type { VariantFilterConfig } from '../../components/pageStateSelectors/VariantFilterConfig.ts';

export class CompareToBaselineStateHandler implements PageStateHandler<CompareToBaselineData> {
    protected readonly pathname;

    constructor(
        protected readonly constants: SingleVariantConstants,
        protected readonly defaultPageState: CompareToBaselineData,
        pathFragment: string,
    ) {
        this.pathname = `/${pathFragment}/${compareToBaselineViewConstants.pathFragment}`;
    }

    public getDefaultPageUrl() {
        return this.toUrl(this.defaultPageState);
    }

    public parsePageStateFromUrl(url: URL): CompareToBaselineData {
        const search = url.searchParams;

        const datasetFilter = {
            location: getLapisLocationFromSearch(search, this.constants.locationFields),
            dateRange:
                getDateRangeFromSearch(search, this.constants.mainDateField, this.constants.dateRangeOptions) ??
                this.constants.defaultDateRange,
        };

        const baselineFilter = getLapisVariantQuery(search, getLineageFilterFields(this.constants.lineageFilters));

        const filterPerColumn = decodeFiltersFromSearch(url.searchParams);

        const variants = new Map<number, VariantFilter>();
        for (const [columnId, filterParams] of filterPerColumn) {
            variants.set(columnId, this.getFilter(filterParams));
        }

        return {
            datasetFilter,
            variants,
            baselineFilter,
        };
    }

    public toUrl(pageState: CompareToBaselineData): string {
        const search = searchParamsFromFilterMap(pageState.variants, (search, variant) =>
            setSearchFromLapisVariantQuery(search, variant, getLineageFilterFields(this.constants.lineageFilters)),
        );

        setSearchFromLocation(search, pageState.datasetFilter.location);
        if (pageState.datasetFilter.dateRange !== this.constants.defaultDateRange) {
            setSearchFromDateRange(search, this.constants.mainDateField, pageState.datasetFilter.dateRange);
        }

        setSearchFromLapisVariantQuery(
            search,
            pageState.baselineFilter,
            getLineageFilterFields(this.constants.lineageFilters),
        );

        return `${this.pathname}?${search}`;
    }

    public datasetFilterToLapisFilter(baselineFilter: DatasetFilter): LapisFilter {
        return toLapisFilterWithoutVariant({ datasetFilter: baselineFilter }, this.constants);
    }

    public baselineFilterToLapisFilter(pageState: CompareToBaselineData): LapisFilter {
        const datasetFilter = this.datasetFilterToLapisFilter(pageState.datasetFilter);

        return {
            ...datasetFilter,
            ...pageState.baselineFilter.lineages,
            ...pageState.baselineFilter.mutations,
        };
    }

    public variantFiltersToNamedLapisFilters(pageState: CompareToBaselineData): NamedLapisFilter[] {
        const datasetFilter = this.datasetFilterToLapisFilter(pageState.datasetFilter);

        return Array.from(pageState.variants.values()).map((variantFilter) => {
            return {
                lapisFilter: {
                    ...datasetFilter,
                    ...variantFilter.lineages,
                    ...variantFilter.mutations,
                },
                displayName: toDisplayName(variantFilter),
            };
        });
    }

    public getEmptyVariantFilterConfig(): VariantFilterConfig {
        return this.toLineageAndMutationFilterConfig({
            lineages: {},
            mutations: {},
        });
    }

    public toVariantFilterConfigs(pageState: CompareToBaselineData): Map<Id, VariantFilterConfig> {
        return new Map<Id, VariantFilterConfig>(
            Array.from(pageState.variants, ([key, variant]) => [key, this.toLineageAndMutationFilterConfig(variant)]),
        );
    }

    public toBaselineFilterConfig(pageState: CompareToBaselineData): VariantFilterConfig {
        return this.toLineageAndMutationFilterConfig(pageState.baselineFilter);
    }

    private getFilter(filterParams: Map<string, string>): VariantFilter {
        return {
            ...getLapisVariantQuery(filterParams, getLineageFilterFields(this.constants.lineageFilters)),
        };
    }

    private toLineageAndMutationFilterConfig(variant: VariantFilter) {
        return {
            lineageFilterConfigs: getLineageFilterConfigs(this.constants.lineageFilters, variant.lineages),
            mutationFilterConfig: variant.mutations,
        };
    }
}
