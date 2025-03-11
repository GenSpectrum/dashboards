import { dateRangeOptionPresets, views, type MutationAnnotation } from '@genspectrum/dashboard-components/util';

import {
    getIntegerFromSearch,
    getLapisVariantQuery,
    setSearchFromLapisVariantQuery,
    setSearchFromLocation,
} from './helpers.ts';
import { type OrganismsConfig } from '../config.ts';
import {
    BaseView,
    GenericCompareToBaselineView,
    GenericCompareVariantsView,
    GenericSequencingEffortsView,
} from './BaseView.ts';
import { type OrganismConstants } from './OrganismConstants.ts';
import { type CompareSideBySideData, type DatasetAndVariantData, getLineageFilterFields, type Id } from './View.ts';
import { compareSideBySideViewConstants, singleVariantViewConstants } from './ViewConstants.ts';
import { CompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';
import {
    type PageStateHandler,
    setSearchFromDateFilters,
    setSearchFromTextFilters,
} from './pageStateHandlers/PageStateHandler.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { organismConfig, Organisms } from '../types/Organism.ts';
import { type DataOrigin, dataOrigins } from '../types/dataOrigins.ts';
import { SingleVariantPageStateHandler } from './pageStateHandlers/SingleVariantPageStateHandler.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';
import { formatUrl } from '../util/formatUrl.ts';

const earliestDate = '2020-01-06';
const hostField = 'host';

class CovidConstants implements OrganismConstants {
    public readonly organism = Organisms.covid;
    public readonly earliestDate = earliestDate;
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
    // Same as `lineageFilters` but for Nextstrain Clade, used for 'Sub-lineages Nextstrain Clade'
    public readonly nextstrainCladeLineageFilters: LineageFilterConfig[] = [
        {
            lapisField: 'nextstrainClade',
            placeholderText: 'Nextstrain clade',
            filterType: 'lineage' as const,
            initialValue: undefined,
        },
    ];
    public readonly useAdvancedQuery = true;
    public readonly baselineFilterConfigs: BaselineFilterConfig[] = [
        {
            type: 'date',
            dateRangeOptions: [
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
            ],
            earliestDate: earliestDate,
            defaultDateRange: dateRangeOptionPresets.lastYear,
            dateColumn: 'date',
            label: 'Date',
        },
        {
            lapisField: hostField,
            placeholderText: 'Host',
            type: 'text' as const,
            label: 'Host',
        },
    ];
    public readonly hostField: string = hostField;
    public readonly originatingLabField: string | undefined;
    public readonly submittingLabField: string | undefined;
    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = [dataOrigins.nextstrain];
    public readonly accessionDownloadFields;
    public readonly mutationAnnotations: MutationAnnotation[] = [];

    public get additionalSequencingEffortsFields() {
        const originatingLab =
            this.originatingLabField === undefined
                ? []
                : [
                      {
                          label: 'Originating lab',
                          fields: [this.originatingLabField],
                          views: [views.table],
                      },
                  ];
        const submittingLab =
            this.submittingLabField === undefined
                ? []
                : [
                      {
                          label: 'Submitting lab ',
                          fields: [this.submittingLabField],
                          views: [views.table],
                      },
                  ];
        return [...originatingLab, ...submittingLab];
    }

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.covid.lapis.mainDateField;
        this.locationFields = organismsConfig.covid.lapis.locationFields;
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
                        dateFilters: {},
                        textFilters: {},
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
        setSearchFromDateFilters(search, pageState, this.constants.baselineFilterConfigs);
        setSearchFromTextFilters(search, pageState, this.constants.baselineFilterConfigs);

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

export class CovidCompareSideBySideView extends BaseView<
    CompareSideBySideData,
    CovidConstants,
    CompareSideBySideStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new CovidConstants(organismsConfig);
        const defaultPageState = {
            filters: new Map<Id, DatasetAndVariantData>([
                [
                    0,
                    {
                        datasetFilter: {
                            location: {},
                            dateFilters: {},
                            textFilters: {},
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
                            dateFilters: {},
                            textFilters: {},
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
            new CompareSideBySideStateHandler(
                constants,
                defaultPageState,
                organismConfig[constants.organism].pathFragment,
            ),
            compareSideBySideViewConstants,
        );
    }
}

export class CovidSequencingEffortsView extends GenericSequencingEffortsView<CovidConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new CovidConstants(organismsConfig));
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
