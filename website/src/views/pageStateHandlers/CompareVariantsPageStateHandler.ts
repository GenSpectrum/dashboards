import type { LapisFilter, NamedLapisFilter } from '@genspectrum/dashboard-components/util';

import type { ExtendedConstants } from '../OrganismConstants.ts';
import {
    type CompareVariantsData,
    type DatasetFilter,
    getLineageFilterFields,
    getVariantFilterConfig,
    type Id,
    type VariantFilter,
} from '../View.ts';
import { compareVariantsViewConstants } from '../ViewConstants.ts';
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
    toDisplayName,
    toLapisFilterFromVariant,
    toLapisFilterWithoutVariant,
} from './PageStateHandler.ts';
import type { VariantFilterConfig } from '../../components/pageStateSelectors/VariantFilterConfig.ts';
import { formatUrl } from '../../util/formatUrl.ts';

export class CompareVariantsPageStateHandler implements PageStateHandler<CompareVariantsData> {
    protected readonly pathname;

    constructor(
        protected readonly constants: ExtendedConstants,
        protected readonly defaultPageState: CompareVariantsData,
        pathFragment: string,
    ) {
        this.pathname = `/${pathFragment}/${compareVariantsViewConstants.pathFragment}`;
    }

    public getDefaultPageUrl() {
        return this.toUrl(this.defaultPageState);
    }

    public parsePageStateFromUrl(url: URL): CompareVariantsData {
        const search = url.searchParams;

        const datasetFilter = {
            location: getLapisLocationFromSearch(search, this.constants.locationFields),
            dateRange:
                getDateRangeFromSearch(search, this.constants.mainDateField, this.constants.dateRangeOptions) ??
                this.constants.defaultDateRange,
        };

        const filterPerColumn = decodeFiltersFromSearch(url.searchParams);

        const variants = new Map<number, VariantFilter>();
        for (const [columnId, filterParams] of filterPerColumn) {
            variants.set(columnId, this.getFilter(filterParams));
        }

        return {
            datasetFilter,
            variants,
        };
    }

    public toUrl(pageState: CompareVariantsData): string {
        const search = searchParamsFromFilterMap(pageState.variants, (search, variant) =>
            setSearchFromLapisVariantQuery(search, variant, getLineageFilterFields(this.constants.lineageFilters)),
        );

        setSearchFromLocation(search, pageState.datasetFilter.location);
        if (pageState.datasetFilter.dateRange !== this.constants.defaultDateRange) {
            setSearchFromDateRange(search, this.constants.mainDateField, pageState.datasetFilter.dateRange);
        }

        return formatUrl(this.pathname, search);
    }

    public datasetFilterToLapisFilter(datasetFilter: DatasetFilter): LapisFilter {
        return toLapisFilterWithoutVariant({ datasetFilter }, this.constants);
    }

    public variantFiltersToNamedLapisFilters(pageState: CompareVariantsData): NamedLapisFilter[] {
        const baselineFilter = this.datasetFilterToLapisFilter(pageState.datasetFilter);

        return Array.from(pageState.variants.values()).map((variantFilter) => {
            return {
                lapisFilter: {
                    ...baselineFilter,
                    ...toLapisFilterFromVariant(variantFilter),
                },
                displayName: toDisplayName(variantFilter),
            };
        });
    }

    public getEmptyVariantFilterConfig(): VariantFilterConfig {
        return getVariantFilterConfig(
            this.constants.lineageFilters,
            {
                lineages: {},
                mutations: {},
            },
            this.constants.useAdvancedQuery,
        );
    }

    public toVariantFilterConfigs(pageState: CompareVariantsData): Map<Id, VariantFilterConfig> {
        return new Map<Id, VariantFilterConfig>(
            Array.from(pageState.variants, ([key, variant]) => [
                key,
                getVariantFilterConfig(this.constants.lineageFilters, variant, this.constants.useAdvancedQuery),
            ]),
        );
    }

    private getFilter(filterParams: Map<string, string>): VariantFilter {
        return {
            ...getLapisVariantQuery(filterParams, getLineageFilterFields(this.constants.lineageFilters)),
        };
    }
}
