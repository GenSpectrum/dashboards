import type { LapisFilter, NamedLapisFilter } from '@genspectrum/dashboard-components/util';

import type { OrganismConstants } from '../OrganismConstants.ts';
import { type CompareToBaselineData, type DatasetFilter, getLineageFilterFields, type VariantFilter } from '../View.ts';
import { compareToBaselineViewConstants } from '../ViewConstants.ts';
import { getLapisVariantQuery, setSearchFromLapisVariantQuery } from '../helpers.ts';
import {
    decodeFiltersFromSearch,
    type PageStateHandler,
    parseDateRangesFromUrl,
    parseLocationFiltersFromUrl,
    parseTextFiltersFromUrl,
    searchParamsFromFilterMap,
    setSearchFromDateFilters,
    setSearchFromLocationFilters,
    setSearchFromTextFilters,
    toDisplayName,
    toLapisFilterFromVariant,
    toLapisFilterWithoutVariant,
} from './PageStateHandler.ts';
import { formatUrl } from '../../util/formatUrl.ts';

export class CompareToBaselineStateHandler implements PageStateHandler<CompareToBaselineData> {
    protected readonly pathname;

    constructor(
        protected readonly constants: OrganismConstants,
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

        const filterPerColumn = decodeFiltersFromSearch(url.searchParams);
        const variants = new Map<number, VariantFilter>();
        for (const [columnId, filterParams] of filterPerColumn) {
            variants.set(columnId, this.getFilter(filterParams));
        }

        return {
            datasetFilter: {
                locationFilters: parseLocationFiltersFromUrl(search, this.constants.baselineFilterConfigs),
                dateFilters: parseDateRangesFromUrl(search, this.constants.baselineFilterConfigs),
                textFilters: parseTextFiltersFromUrl(search, this.constants.baselineFilterConfigs),
            },
            variants,
            baselineFilter: getLapisVariantQuery(search, getLineageFilterFields(this.constants.lineageFilters)),
        };
    }

    public toUrl(pageState: CompareToBaselineData): string {
        const search = searchParamsFromFilterMap(pageState.variants, (search, variant) =>
            setSearchFromLapisVariantQuery(search, variant, getLineageFilterFields(this.constants.lineageFilters)),
        );

        setSearchFromLocationFilters(search, pageState, this.constants.baselineFilterConfigs);
        setSearchFromDateFilters(search, pageState, this.constants.baselineFilterConfigs);
        setSearchFromTextFilters(search, pageState, this.constants.baselineFilterConfigs);

        setSearchFromLapisVariantQuery(
            search,
            pageState.baselineFilter,
            getLineageFilterFields(this.constants.lineageFilters),
        );

        return formatUrl(this.pathname, search);
    }

    public datasetFilterToLapisFilter(baselineFilter: DatasetFilter): LapisFilter {
        return toLapisFilterWithoutVariant({ datasetFilter: baselineFilter }, this.constants.additionalFilters);
    }

    public baselineFilterToLapisFilter(pageState: CompareToBaselineData): LapisFilter {
        const datasetFilter = this.datasetFilterToLapisFilter(pageState.datasetFilter);

        return {
            ...datasetFilter,
            ...toLapisFilterFromVariant(pageState.baselineFilter),
        };
    }

    public variantFiltersToNamedLapisFilters(pageState: CompareToBaselineData): NamedLapisFilter[] {
        const datasetFilter = this.datasetFilterToLapisFilter(pageState.datasetFilter);

        return Array.from(pageState.variants.values()).map((variantFilter) => {
            return {
                lapisFilter: {
                    ...datasetFilter,
                    ...toLapisFilterFromVariant(variantFilter),
                },
                displayName: toDisplayName(variantFilter),
            };
        });
    }

    private getFilter(filterParams: Map<string, string>): VariantFilter {
        return {
            ...getLapisVariantQuery(filterParams, getLineageFilterFields(this.constants.lineageFilters)),
        };
    }
}
