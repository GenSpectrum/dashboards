import type { LapisFilter, NamedLapisFilter } from '@genspectrum/dashboard-components/util';

import type { OrganismConstants } from '../OrganismConstants.ts';
import { type CompareVariantsData, type DatasetFilter, getLineageFilterFields, type VariantFilter } from '../View.ts';
import { compareVariantsViewConstants } from '../ViewConstants.ts';
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

export class CompareVariantsPageStateHandler implements PageStateHandler<CompareVariantsData> {
    protected readonly pathname;

    constructor(
        protected readonly constants: OrganismConstants,
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
        };
    }

    public toUrl(pageState: CompareVariantsData): string {
        const search = searchParamsFromFilterMap(pageState.variants, (search, variant) =>
            setSearchFromLapisVariantQuery(search, variant, getLineageFilterFields(this.constants.lineageFilters)),
        );

        setSearchFromLocationFilters(search, pageState, this.constants.baselineFilterConfigs);
        setSearchFromDateFilters(search, pageState, this.constants.baselineFilterConfigs);
        setSearchFromTextFilters(search, pageState, this.constants.baselineFilterConfigs);

        return formatUrl(this.pathname, search);
    }

    public datasetFilterToLapisFilter(datasetFilter: DatasetFilter): LapisFilter {
        return toLapisFilterWithoutVariant({ datasetFilter }, this.constants.additionalFilters);
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

    private getFilter(filterParams: Map<string, string>): VariantFilter {
        return {
            ...getLapisVariantQuery(filterParams, getLineageFilterFields(this.constants.lineageFilters)),
        };
    }
}
