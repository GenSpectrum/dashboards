import { dateRangeOptionPresets, type MutationAnnotation, views } from '@genspectrum/dashboard-components/util';

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
import {
    getHostsAggregatedVisualization,
    getLineagesAggregatedVisualizations,
    type OrganismConstants,
} from './OrganismConstants.ts';
import {
    type CompareSideBySideData,
    type DatasetAndVariantData,
    type DatasetFilter,
    getLineageFilterFields,
    makeCompareSideBySideData,
    makeCompareToBaselineData,
    makeCompareVariantsData,
    makeDatasetAndVariantData,
} from './View.ts';
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
import { defaultDateRangeOption } from '../util/defaultDateRangeOption.ts';
import { formatUrl } from '../util/formatUrl.ts';

const earliestDate = '2020-01-06';
const hostField = 'host';

const mainDateFilterColumn = 'date';

const NEXTCLADE_PANGO_LINEAGE_FIELD_NAME = 'nextcladePangoLineage';
const NEXTSTRAIN_CLADE_FIELD_NAME = 'nextstrainClade';

const dateRangeOptions = [
    dateRangeOptionPresets.lastMonth,
    dateRangeOptionPresets.last2Months,
    dateRangeOptionPresets.last3Months,
    dateRangeOptionPresets.last6Months,
    dateRangeOptionPresets.lastYear,
    defaultDateRangeOption.year2024,
    defaultDateRangeOption.year2023,
    defaultDateRangeOption.year2022,
    defaultDateRangeOption.year2021,
    defaultDateRangeOption.year2020,
    dateRangeOptionPresets.allTimes,
];

class CovidConstants implements OrganismConstants {
    public readonly organism = Organisms.covid;
    public readonly earliestDate = earliestDate;
    public readonly mainDateField: string;
    public readonly locationFields = ['region', 'country', 'division'];
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: NEXTCLADE_PANGO_LINEAGE_FIELD_NAME,
            placeholderText: 'Nextclade pango lineage',
            filterType: 'lineage' as const,
        },
    ];
    public readonly useAdvancedQuery = true;
    public readonly baselineFilterConfigs: BaselineFilterConfig[] = [
        {
            type: 'date',
            dateRangeOptions,
            earliestDate,
            dateColumn: mainDateFilterColumn,
            label: 'Date',
        },
        {
            lapisField: hostField,
            placeholderText: 'Host',
            type: 'text' as const,
            label: 'Host',
        },
        {
            lapisField: 'samplingStrategy',
            placeholderText: 'Sampling strategy',
            type: 'text' as const,
            label: 'Sampling strategy',
        },
        {
            type: 'date',
            dateRangeOptions,
            earliestDate,
            dateColumn: 'dateSubmitted',
            label: 'Date submitted',
        },
        {
            lapisField: 'regionExposure',
            placeholderText: 'Region exposure',
            type: 'text' as const,
            label: 'Region exposure',
        },
        {
            lapisField: 'countryExposure',
            placeholderText: 'Country exposure',
            type: 'text' as const,
            label: 'Country exposure',
        },
        {
            lapisField: 'divisionExposure',
            placeholderText: 'Division exposure',
            type: 'text' as const,
            label: 'Division exposure',
        },
    ];
    public readonly hostField: string = hostField;
    public readonly originatingLabField = 'originatingLab';
    public readonly submittingLabField = 'submittingLab';
    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = [dataOrigins.nextstrain];
    public readonly accessionDownloadFields = ['strain'];
    public readonly mutationAnnotations: MutationAnnotation[] = [];

    public get aggregatedVisualizations() {
        const hosts = getHostsAggregatedVisualization(this);
        const lineages = [
            ...getLineagesAggregatedVisualizations({
                label: 'Nextclade pango lineage',
                fields: [NEXTCLADE_PANGO_LINEAGE_FIELD_NAME],
            }),
            ...getLineagesAggregatedVisualizations({
                label: 'Nextstrain clade',
                fields: [NEXTSTRAIN_CLADE_FIELD_NAME],
            }),
        ];

        return {
            sequencingEfforts: [
                hosts,
                ...lineages,
                {
                    label: 'Originating lab',
                    fields: [this.originatingLabField],
                    views: [views.table],
                },
                {
                    label: 'Submitting lab',
                    fields: [this.submittingLabField],
                    views: [views.table],
                },
            ],
            singleVariant: [...lineages, hosts],
            compareSideBySide: [...lineages, hosts],
        };
    }

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.covid.lapis.mainDateField;
        this.additionalFilters = organismsConfig.covid.lapis.additionalFilters;
    }
}

const defaultDatasetFilter: DatasetFilter = {
    location: {},
    textFilters: {},
    dateFilters: {
        [mainDateFilterColumn]: dateRangeOptionPresets.lastYear,
    },
};

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
                makeDatasetAndVariantData(defaultDatasetFilter),
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
        const defaultPageState = makeCompareSideBySideData(defaultDatasetFilter, [
            {
                lineages: {
                    [NEXTCLADE_PANGO_LINEAGE_FIELD_NAME]: 'JN.1*',
                },
            },
            {
                lineages: {
                    [NEXTCLADE_PANGO_LINEAGE_FIELD_NAME]: 'XBB.1*',
                },
            },
        ]);

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
        super(new CovidConstants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class CovidCompareVariantsView extends GenericCompareVariantsView<CovidConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new CovidConstants(organismsConfig), makeCompareVariantsData(defaultDatasetFilter));
    }
}

export class CovidCompareToBaselineView extends GenericCompareToBaselineView<CovidConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new CovidConstants(organismsConfig), makeCompareToBaselineData(defaultDatasetFilter));
    }
}
