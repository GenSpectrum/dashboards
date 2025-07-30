import type { LapisFilter, NamedLapisFilter } from '@genspectrum/dashboard-components/util';

import { paths } from '../../types/Organism.ts';
import type { OrganismConstants } from '../OrganismConstants.ts';
import { type CompareVariantsData, type DatasetFilter, getLineageFilterFields, type VariantFilter } from '../View.ts';
import { compareVariantsViewConstants } from '../ViewConstants.ts';
import {
    getLapisVariantQuery,
    getStringFromSearch,
    setSearchFromLapisVariantQuery,
    setSearchFromString,
} from '../helpers.ts';
import { type PageStateHandler, toDisplayName, toLapisFilterWithVariant } from './PageStateHandler.ts';
import { parseDateRangesFromUrl, setSearchFromDateFilters } from './dateFilterFromToUrl.ts';
import { parseLocationFiltersFromUrl, setSearchFromLocationFilters } from './locationFilterFromToUrl.ts';
import { decodeFiltersFromSearch, searchParamsFromFilterMap } from './multipleFiltersFromToUrl.ts';
import { parseNumberRangeFilterFromUrl, setSearchFromNumberRangeFilters } from './numberRangeFilterFromToUrl.ts';
import { parseTextFiltersFromUrl, setSearchFromTextFilters } from './textFilterFromToUrl.ts';
import { toLapisFilterWithoutVariant } from './toLapisFilterWithoutVariant.ts';
import { advancedQueryUrlParam } from '../../components/genspectrum/AdvancedQueryFilter.tsx';
import { formatUrl } from '../../util/formatUrl.ts';

export class CompareVariantsPageStateHandler implements PageStateHandler<CompareVariantsData> {
    protected readonly pathname;

    constructor(
        protected readonly constants: OrganismConstants,
        protected readonly defaultPageState: CompareVariantsData,
    ) {
        this.pathname = `${paths[constants.organism].basePath}/${compareVariantsViewConstants.pathFragment}`;
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
                numberFilters: parseNumberRangeFilterFromUrl(search, this.constants.baselineFilterConfigs),
                advancedQuery: getStringFromSearch(search, advancedQueryUrlParam),
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
        setSearchFromNumberRangeFilters(search, pageState, this.constants.baselineFilterConfigs);
        setSearchFromString(search, advancedQueryUrlParam, pageState.datasetFilter.advancedQuery);

        return formatUrl(this.pathname, search);
    }

    public datasetFilterToLapisFilter(datasetFilter: DatasetFilter): LapisFilter {
        return toLapisFilterWithoutVariant(datasetFilter, this.constants.additionalFilters);
    }

    public variantFiltersToNamedLapisFilters(pageState: CompareVariantsData): NamedLapisFilter[] {
        return Array.from(pageState.variants.values()).map((variantFilter) => {
            return {
                lapisFilter: toLapisFilterWithVariant({
                    datasetFilter: pageState.datasetFilter,
                    variantFilter,
                    additionalFilters: this.constants.additionalFilters,
                }),
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
