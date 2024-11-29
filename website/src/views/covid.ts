import { type DateRangeOption, dateRangeOptionPresets } from '@genspectrum/dashboard-components/util';

import {
    type BaselineData,
    type CompareSideBySideData,
    getLineageFilterFields,
    type Id,
    type VariantData,
} from './View.ts';
import {
    getDateRangeFromSearch,
    getIntegerFromSearch,
    getLapisCovidVariantQuery,
    getLapisLocationFromSearch,
    type LapisCovidVariantFilter,
    setSearchFromDateRange,
    setSearchFromLapisCovidVariantQuery,
    setSearchFromLocation,
} from './helpers.ts';
import { type OrganismsConfig } from '../config.ts';
import { BaseView, GenericCompareVariantsView } from './BaseView.ts';
import type { SingleVariantConstants } from './OrganismConstants.ts';
import {
    CompareSideBySideStateHandler,
    type PageStateHandler,
    SequencingEffortsStateHandler,
    SingleVariantStateHandler,
} from './PageStateHandler.ts';
import {
    compareSideBySideViewConstants,
    sequencingEffortsViewConstants,
    singleVariantViewConstants,
} from './ViewConstants.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
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

type CovidCompareSideBySideFilter = BaselineData & VariantData<LapisCovidVariantFilter>;
export type CovidCompareSideBySideData = CompareSideBySideData<CovidCompareSideBySideFilter>;

export class CovidCompareSideBySideView extends BaseView<
    CovidCompareSideBySideData,
    CovidConstants,
    CovidCompareSideBySideStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new CovidConstants(organismsConfig);
        const defaultPageState = {
            filters: new Map<Id, CovidCompareSideBySideFilter>([
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
            new CovidCompareSideBySideStateHandler(
                new CovidConstants(organismsConfig),
                defaultPageState,
                organismConfig[constants.organism].pathFragment,
            ),
            compareSideBySideViewConstants,
        );
    }
}

class CovidCompareSideBySideStateHandler extends CompareSideBySideStateHandler<CovidCompareSideBySideFilter> {
    protected override writeColumnDataToSearchParams(
        searchOfFilter: URLSearchParams,
        filter: CovidCompareSideBySideFilter,
    ): void {
        setSearchFromLapisCovidVariantQuery(
            searchOfFilter,
            filter.variantFilter,
            getLineageFilterFields(this.constants.lineageFilters),
        );
        setSearchFromLocation(searchOfFilter, filter.baselineFilter.location);
        setSearchFromDateRange(searchOfFilter, this.constants.mainDateField, filter.baselineFilter.dateRange);
    }

    protected override getEmptyColumnData(): CovidCompareSideBySideFilter {
        return {
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
        };
    }

    protected override getFilter(filterParams: Map<string, string>): CovidCompareSideBySideFilter {
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
            variantFilter: getLapisCovidVariantQuery(
                filterParams,
                getLineageFilterFields(this.constants.lineageFilters),
            ),
        };
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

export class CovidCompareVariantsView extends GenericCompareVariantsView<CovidConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new CovidConstants(organismsConfig));
    }
}
