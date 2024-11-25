import { type DateRangeOption, dateRangeOptionPresets } from '@genspectrum/dashboard-components/util';

import { type BaselineData, BaseView, getLineageFilterFields, type VariantData } from './View.ts';
import {
    getDateRangeFromSearch,
    getIntegerFromSearch,
    getLapisCovidVariantQuery,
    getLapisLocationFromSearch,
    type LapisCovidVariantFilter,
    type LapisFilter,
    setSearchFromDateRange,
    setSearchFromLapisCovidVariantQuery,
    setSearchFromLocation,
} from './helpers.ts';
import { type OrganismsConfig } from '../config.ts';
import type { SingleVariantConstants } from './OrganismConstants.ts';
import { type PageStateHandler, SequencingEffortsStateHandler, SingleVariantStateHandler } from './PageStateHandler.ts';
import {
    compareVariantsViewConstants,
    sequencingEffortsViewConstants,
    singleVariantViewConstants,
} from './ViewConstants.ts';
import { compareVariantsViewKey } from './routing.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/VariantSelector.tsx';
import { organismConfig, Organisms } from '../types/Organism.ts';
import type { DataOrigin } from '../types/dataOrigins.ts';

const earliestDate = '2020-01-06';

class CovidConstants implements SingleVariantConstants {
    public readonly organism = Organisms.covid;
    public readonly defaultDateRange = dateRangeOptionPresets.lastYear;
    public readonly earliestDate = '2020-01-06';
    public readonly dateRangeOptions: DateRangeOption[] = [
        dateRangeOptionPresets.lastMonth,
        dateRangeOptionPresets.last2Months,
        dateRangeOptionPresets.last3Months,
        dateRangeOptionPresets.last6Months,
        dateRangeOptionPresets.lastYear,
        { label: '2024', dateFrom: '2024-01-01', dateTo: '2024-12-31' },
        { label: '2023', dateFrom: '2023-01-02', dateTo: '2023-12-31' },
        { label: '2022', dateFrom: '2022-01-03', dateTo: '2023-01-01' },
        { label: '2021', dateFrom: '2021-01-04', dateTo: '2022-01-02' },
        { label: '2020', dateFrom: earliestDate, dateTo: '2021-01-03' },
        { label: 'All times', dateFrom: this.earliestDate },
    ];
    public readonly mainDateField: string;
    public readonly locationFields: string[];
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: 'nextcladePangoLineage',
            placeholderText: 'Nextclade pango lineage',
            filterType: 'lineage' as const,
            initialValue: undefined,
        },
    ];
    public readonly hostField: string;
    public readonly originatingLabField: string | undefined;
    public readonly submittingLabField: string | undefined;
    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = ['nextstrain'];

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.covid.lapis.mainDateField;
        this.locationFields = organismsConfig.covid.lapis.locationFields;
        this.hostField = organismsConfig.covid.lapis.hostField;
        this.originatingLabField = organismsConfig.covid.lapis.originatingLabField;
        this.submittingLabField = organismsConfig.covid.lapis.submittingLabField;
        this.additionalFilters = organismsConfig.covid.lapis.additionalFilters;
    }
}

export type CovidAnalyzeSingleVariantData = BaselineData &
    VariantData<LapisCovidVariantFilter> & {
        collectionId?: number;
    };

export class CovidAnalyzeSingleVariantView extends BaseView<
    CovidAnalyzeSingleVariantData,
    CovidConstants,
    CovidSingleVariantStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new CovidConstants(organismsConfig);
        super(
            constants,
            new CovidSingleVariantStateHandler(
                constants,
                {
                    baselineFilter: {
                        location: {},
                        dateRange: constants.defaultDateRange,
                    },
                    variantFilter: {
                        lineages: {},
                        mutations: {},
                        variantQuery: undefined,
                    },
                },
                organismConfig[constants.organism].pathFragment,
            ),
            singleVariantViewConstants,
        );
    }
}

class CovidSingleVariantStateHandler
    extends SingleVariantStateHandler
    implements PageStateHandler<CovidAnalyzeSingleVariantData>
{
    constructor(
        protected readonly constants: CovidConstants,
        defaultPageState: CovidAnalyzeSingleVariantData,
        pathname: string,
    ) {
        super(constants, defaultPageState, pathname);
    }

    public override parsePageStateFromUrl(url: URL): CovidAnalyzeSingleVariantData {
        const search = url.searchParams;
        const baselineFilter = super.parsePageStateFromUrl(url).baselineFilter;
        return {
            baselineFilter,
            variantFilter: getLapisCovidVariantQuery(search, getLineageFilterFields(this.constants.lineageFilters)),
            collectionId: getIntegerFromSearch(search, 'collectionId'),
        };
    }

    public override toUrl(pageState: CovidAnalyzeSingleVariantData): string {
        const search = new URLSearchParams();
        setSearchFromLocation(search, pageState.baselineFilter.location);

        if (pageState.baselineFilter.dateRange !== this.constants.defaultDateRange) {
            setSearchFromDateRange(search, this.constants.mainDateField, pageState.baselineFilter.dateRange);
        }

        setSearchFromLapisCovidVariantQuery(
            search,
            pageState.variantFilter,
            getLineageFilterFields(this.constants.lineageFilters),
        );
        if (pageState.collectionId !== undefined) {
            search.set('collectionId', pageState.collectionId.toString());
        }
        return `${this.pathname}?${search}`;
    }

    public override toLapisFilter(pageState: CovidAnalyzeSingleVariantData) {
        return {
            ...super.toLapisFilter(pageState),
            variantQuery: pageState.variantFilter.variantQuery,
        };
    }
}

export type CovidCompareVariantsData = {
    filters: Map<Id, CovidCompareVariantsFilter>;
};

type CovidCompareVariantsFilter = BaselineData & VariantData<LapisCovidVariantFilter>;

type Id = number;

export class CovidCompareVariantsView extends BaseView<
    CovidCompareVariantsData,
    CovidConstants,
    CovidCompareVariantsStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new CovidConstants(organismsConfig);
        const defaultPageState = {
            filters: new Map<Id, CovidCompareVariantsFilter>([
                [
                    0,
                    {
                        baselineFilter: {
                            location: {},
                            dateRange: constants.defaultDateRange,
                        },
                        variantFilter: {
                            lineages: {
                                nextcladePangoLineage: 'JN.1*',
                            },
                            mutations: {},
                            variantQuery: undefined,
                        },
                    },
                ],
                [
                    1,
                    {
                        baselineFilter: {
                            location: {},
                            dateRange: constants.defaultDateRange,
                        },
                        variantFilter: {
                            lineages: {
                                nextcladePangoLineage: 'XBB.1*',
                            },
                            mutations: {},
                            variantQuery: undefined,
                        },
                    },
                ],
            ]),
        };

        super(
            constants,
            new CovidCompareVariantsStateHandler(
                new CovidConstants(organismsConfig),
                defaultPageState,
                organismConfig[constants.organism].pathFragment,
            ),
            compareVariantsViewConstants,
        );
    }
}

class CovidCompareVariantsStateHandler implements PageStateHandler<CovidCompareVariantsData> {
    protected readonly pathname;

    constructor(
        protected readonly constants: CovidConstants,
        protected readonly defaultPageState: CovidCompareVariantsData,
        pathFragment: string,
    ) {
        this.pathname = `/${pathFragment}/${compareVariantsViewConstants.pathFragment}`;
    }

    public getDefaultPageUrl() {
        return this.toUrl(this.defaultPageState);
    }

    public parsePageStateFromUrl(url: URL): CovidCompareVariantsData {
        const filterPerColumn = this.decodeMultipleFiltersFromSearch(url.searchParams);

        const filters = new Map<number, CovidCompareVariantsFilter>();
        for (const [columnId, filterParams] of filterPerColumn) {
            filters.set(columnId, this.getFilter(filterParams));
        }

        return {
            filters,
        };
    }

    public toUrl(pageState: CovidCompareVariantsData): string {
        const searchParameterMap = new Map<Id, Map<string, string>>();

        for (const [columnId, filter] of pageState.filters) {
            searchParameterMap.set(columnId, new Map<string, string>());

            const searchOfFilter = new URLSearchParams();
            setSearchFromLapisCovidVariantQuery(
                searchOfFilter,
                filter.variantFilter,
                getLineageFilterFields(this.constants.lineageFilters),
            );
            setSearchFromLocation(searchOfFilter, filter.baselineFilter.location);
            setSearchFromDateRange(searchOfFilter, this.constants.mainDateField, filter.baselineFilter.dateRange);

            searchOfFilter.forEach((value, key) => {
                searchParameterMap.get(columnId)?.set(key, value);
            });
        }

        const search = this.encodeMultipleFiltersToUrlSearchParam(searchParameterMap);

        return `${this.pathname}?${search}`;
    }

    public setFilter(
        pageState: CovidCompareVariantsData,
        newFilter: CovidCompareVariantsFilter,
        columnId: Id,
    ): CovidCompareVariantsData {
        const filtersPerColumn = new Map(pageState.filters);

        filtersPerColumn.set(columnId, newFilter);
        return {
            ...pageState,
            filters: filtersPerColumn,
        };
    }

    public addEmptyFilter(pageState: CovidCompareVariantsData): CovidCompareVariantsData {
        const lastId = Math.max(...Array.from(pageState.filters.keys()));

        return this.setFilter(
            pageState,
            {
                baselineFilter: {
                    location: {
                        region: 'Europe',
                    },
                    dateRange: this.constants.defaultDateRange,
                },
                variantFilter: {
                    lineages: {},
                    mutations: {},
                },
            },
            lastId + 1,
        );
    }

    public removeFilter(pageState: CovidCompareVariantsData, columnId: number): CovidCompareVariantsData {
        const filters = new Map(pageState.filters);
        filters.delete(columnId);
        return {
            ...pageState,
            filters,
        };
    }

    public baselineFilterToLapisFilter(filter: CovidCompareVariantsFilter['baselineFilter']): LapisFilter {
        return {
            ...filter.location,
            [`${this.constants.mainDateField}From`]: filter.dateRange.dateFrom,
            [`${this.constants.mainDateField}To`]: filter.dateRange.dateTo,
            ...this.constants.additionalFilters,
        };
    }

    private decodeMultipleFiltersFromSearch(search: URLSearchParams) {
        const filterMap = new Map<Id, Map<string, string>>();

        for (const [key, value] of search) {
            const keySplit = key.split('$');
            if (keySplit.length !== 2) {
                throw Error(
                    `Failed parsing query parameters on ${Organisms.covid} ${compareVariantsViewKey}: Invalid key in URLSearchParam: ${key}`,
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
                search.append(`${key}$${id}`, value);
            }
        }
        return search;
    }

    private getFilter(filterParams: Map<string, string>) {
        const filter: BaselineData & VariantData = {
            baselineFilter: {
                location: getLapisLocationFromSearch(filterParams, this.constants.locationFields),
                dateRange:
                    getDateRangeFromSearch(
                        filterParams,
                        this.constants.mainDateField,
                        this.constants.dateRangeOptions,
                    ) ?? this.constants.defaultDateRange,
            },
            variantFilter: getLapisCovidVariantQuery(
                filterParams,
                getLineageFilterFields(this.constants.lineageFilters),
            ),
        };

        return filter;
    }
}

export type CovidSequencingEffortsData = BaselineData & {
    collectionId?: number;
};

export class CovidSequencingEffortsView extends BaseView<
    CovidSequencingEffortsData,
    CovidConstants,
    CovidSequencingEffortsStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new CovidConstants(organismsConfig);
        super(
            constants,
            new CovidSequencingEffortsStateHandler(
                constants,
                {
                    baselineFilter: {
                        location: {},
                        dateRange: constants.defaultDateRange,
                    },
                },
                organismConfig[constants.organism].pathFragment,
            ),
            sequencingEffortsViewConstants,
        );
    }
}

class CovidSequencingEffortsStateHandler
    extends SequencingEffortsStateHandler
    implements PageStateHandler<CovidSequencingEffortsData>
{
    constructor(constants: CovidConstants, defaultPageState: CovidSequencingEffortsData, pathFragment: string) {
        super(constants, defaultPageState, pathFragment);
    }

    public override parsePageStateFromUrl(url: URL): CovidSequencingEffortsData {
        return {
            ...super.parsePageStateFromUrl(url),
            collectionId: getIntegerFromSearch(url.searchParams, 'collectionId'),
        };
    }

    public override toUrl(pageState: CovidSequencingEffortsData): string {
        const search = new URLSearchParams();
        setSearchFromLocation(search, pageState.baselineFilter.location);
        if (pageState.baselineFilter.dateRange !== this.constants.defaultDateRange) {
            setSearchFromDateRange(search, this.constants.mainDateField, pageState.baselineFilter.dateRange);
        }
        if (pageState.collectionId !== undefined) {
            search.set('collectionId', pageState.collectionId.toString());
        }
        return `${this.pathname}?${search}`;
    }
}
