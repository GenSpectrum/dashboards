import { type DateRangeOption, dateRangeOptionPresets, type LapisFilter } from '@genspectrum/dashboard-components/util';

import {
    getDateRangeFromSearch,
    getIntegerFromSearch,
    getLapisLocationFromSearch,
    getLapisVariantQuery,
    setSearchFromDateRange,
    setSearchFromLapisVariantQuery,
    setSearchFromLocation,
} from './helpers.ts';
import { type OrganismsConfig } from '../config.ts';
import { BaseView, GenericCompareToBaselineView, GenericCompareVariantsView } from './BaseView.ts';
import { ComponentHeight, type ExtendedConstants } from './OrganismConstants.ts';
import {
    type CompareSideBySideData,
    type DatasetAndVariantData,
    getLineageFilterFields,
    type Id,
    type VariantData,
} from './View.ts';
import {
    compareSideBySideViewConstants,
    sequencingEffortsViewConstants,
    singleVariantViewConstants,
} from './ViewConstants.ts';
import { CompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';
import { type PageStateHandler, toLapisFilterWithoutVariant } from './pageStateHandlers/PageStateHandler.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { organismConfig, Organisms } from '../types/Organism.ts';
import { type DataOrigin, dataOrigins } from '../types/dataOrigins.ts';
import { SequencingEffortsStateHandler } from './pageStateHandlers/SequencingEffortsPageStateHandler.ts';
import { SingleVariantPageStateHandler } from './pageStateHandlers/SingleVariantPageStateHandler.ts';
import { formatUrl } from '../util/formatUrl.ts';

const earliestDate = '2020-01-06';

class CovidConstants implements ExtendedConstants {
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
    public readonly useAdvancedQuery = true;
    public readonly hostField: string;
    public readonly originatingLabField: string | undefined;
    public readonly submittingLabField: string | undefined;
    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = [dataOrigins.nextstrain];
    public readonly accessionDownloadFields;

    public get additionalSequencingEffortsFields() {
        const originatingLab =
            this.originatingLabField === undefined
                ? []
                : [{ label: 'Originating lab', fields: [this.originatingLabField], height: ComponentHeight.large }];
        const submittingLab =
            this.submittingLabField === undefined
                ? []
                : [{ label: 'Submitting lab ', fields: [this.submittingLabField], height: ComponentHeight.large }];
        return [...originatingLab, ...submittingLab];
    }

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.covid.lapis.mainDateField;
        this.locationFields = organismsConfig.covid.lapis.locationFields;
        this.hostField = organismsConfig.covid.lapis.hostField;
        this.originatingLabField = organismsConfig.covid.lapis.originatingLabField;
        this.submittingLabField = organismsConfig.covid.lapis.submittingLabField;
        this.additionalFilters = organismsConfig.covid.lapis.additionalFilters;
        this.accessionDownloadFields = organismsConfig.covid.lapis.accessionDownloadFields;
    }
}

export type CovidVariantData = DatasetAndVariantData & { collectionId?: number };

export class CovidAnalyzeSingleVariantView extends BaseView<
    CovidVariantData,
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
                    datasetFilter: {
                        location: {},
                        dateRange: constants.defaultDateRange,
                    },
                    variantFilter: {
                        lineages: {},
                        mutations: {},
                    },
                },
                organismConfig[constants.organism].pathFragment,
            ),
            singleVariantViewConstants,
        );
    }
}

class CovidSingleVariantStateHandler
    extends SingleVariantPageStateHandler
    implements PageStateHandler<CovidVariantData>
{
    constructor(
        protected readonly constants: CovidConstants,
        defaultPageState: CovidVariantData,
        pathname: string,
    ) {
        super(constants, defaultPageState, pathname);
    }

    public override parsePageStateFromUrl(url: URL): CovidVariantData {
        const search = url.searchParams;
        const baselineFilter = super.parsePageStateFromUrl(url).datasetFilter;
        return {
            datasetFilter: baselineFilter,
            variantFilter: getLapisVariantQuery(search, getLineageFilterFields(this.constants.lineageFilters)),
            collectionId: getIntegerFromSearch(search, 'collectionId'),
        };
    }

    public override toUrl(pageState: CovidVariantData): string {
        const search = new URLSearchParams();
        setSearchFromLocation(search, pageState.datasetFilter.location);

        if (pageState.datasetFilter.dateRange !== this.constants.defaultDateRange) {
            setSearchFromDateRange(search, this.constants.mainDateField, pageState.datasetFilter.dateRange);
        }

        setSearchFromLapisVariantQuery(
            search,
            pageState.variantFilter,
            getLineageFilterFields(this.constants.lineageFilters),
        );
        if (pageState.collectionId !== undefined) {
            search.set('collectionId', pageState.collectionId.toString());
        }
        return formatUrl(this.pathname, search);
    }
}

type CovidCompareSideBySideFilter = DatasetAndVariantData & VariantData;
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
                        datasetFilter: {
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
                        datasetFilter: {
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
        setSearchFromLapisVariantQuery(
            searchOfFilter,
            filter.variantFilter,
            getLineageFilterFields(this.constants.lineageFilters),
        );
        setSearchFromLocation(searchOfFilter, filter.datasetFilter.location);
        setSearchFromDateRange(searchOfFilter, this.constants.mainDateField, filter.datasetFilter.dateRange);
    }

    protected override getEmptyColumnData(): CovidCompareSideBySideFilter {
        return {
            datasetFilter: {
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
        datasetFilter: CovidCompareSideBySideFilter['datasetFilter'],
        variantFilter: CovidCompareSideBySideFilter['variantFilter'],
    ): LapisFilter {
        if (variantFilter.variantQuery) {
            return {
                variantQuery: variantFilter.variantQuery,
                ...toLapisFilterWithoutVariant({ datasetFilter }, this.constants),
            };
        } else {
            return {
                ...variantFilter.lineages,
                ...variantFilter.mutations,
                ...toLapisFilterWithoutVariant({ datasetFilter }, this.constants),
            };
        }
    }
}

export class CovidSequencingEffortsView extends BaseView<
    CovidVariantData,
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
                    datasetFilter: {
                        location: {},
                        dateRange: constants.defaultDateRange,
                    },
                    variantFilter: {
                        lineages: {},
                        mutations: {},
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
    implements PageStateHandler<CovidVariantData>
{
    public override parsePageStateFromUrl(url: URL): CovidVariantData {
        const search = url.searchParams;
        const baselineFilter = super.parsePageStateFromUrl(url).datasetFilter;
        return {
            datasetFilter: baselineFilter,
            variantFilter: getLapisVariantQuery(search, getLineageFilterFields(this.constants.lineageFilters)),
            collectionId: getIntegerFromSearch(search, 'collectionId'),
        };
    }

    public override toUrl(pageState: CovidVariantData): string {
        const search = new URLSearchParams();
        setSearchFromLocation(search, pageState.datasetFilter.location);
        if (pageState.datasetFilter.dateRange !== this.constants.defaultDateRange) {
            setSearchFromDateRange(search, this.constants.mainDateField, pageState.datasetFilter.dateRange);
        }
        setSearchFromLapisVariantQuery(
            search,
            pageState.variantFilter,
            getLineageFilterFields(this.constants.lineageFilters),
        );
        if (pageState.collectionId !== undefined) {
            search.set('collectionId', pageState.collectionId.toString());
        }

        return formatUrl(this.pathname, search);
    }
}

export class CovidCompareVariantsView extends GenericCompareVariantsView<CovidConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new CovidConstants(organismsConfig));
    }
}

export class CovidCompareToBaselineView extends GenericCompareToBaselineView<CovidConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new CovidConstants(organismsConfig));
    }
}
