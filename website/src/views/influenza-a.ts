import { dateRangeOptionPresets, type MutationAnnotation, views } from '@genspectrum/dashboard-components/util';

import {
    type CompareSideBySideData,
    type DatasetFilter,
    GENSPECTRUM_LOCULUS_MAIN_FILTER_DATE_COLUMN,
    makeCompareSideBySideData,
    makeDatasetAndVariantData,
} from './View.ts';
import type { OrganismsConfig } from '../config.ts';
import { BaseView, GenericSequencingEffortsView } from './BaseView.ts';
import {
    GENSPECTRUM_LOCULUS_HOST_FIELD,
    GENSPECTRUM_LOCULUS_LOCATION_FIELDS,
    getGenSpectrumLoculusAggregatedVisualizations,
    getGenspectrumLoculusFilters,
    INFLUENZA_ACCESSION_DOWNLOAD_FIELDS,
    LOCULUS_AUTHORS_AFFILIATIONS_FIELD,
    LOCULUS_AUTHORS_FIELD,
    type OrganismConstants,
} from './OrganismConstants.ts';
import { compareSideBySideViewConstants } from './ViewConstants.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { Organisms } from '../types/Organism.ts';
import { type DataOrigin, dataOrigins } from '../types/dataOrigins.ts';
import { CompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';
import { fineGrainedDefaultDateRangeOptions } from '../util/defaultDateRangeOption.ts';

const earliestDate = '1905-01-01';

const SUBTYPE_HA_FIELD_NAME = 'subtypeHA';
const SUBTYPE_NA_FIELD_NAME = 'subtypeNA';

class InfluenzaAConstants implements OrganismConstants {
    public readonly organism = Organisms.influenzaA;
    public readonly earliestDate = earliestDate;
    public readonly mainDateField: string;
    public readonly locationFields = GENSPECTRUM_LOCULUS_LOCATION_FIELDS;
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: SUBTYPE_HA_FIELD_NAME,
            placeholderText: 'HA subtype',
            filterType: 'text' as const,
        },
        {
            lapisField: SUBTYPE_NA_FIELD_NAME,
            placeholderText: 'NA subtype',
            filterType: 'text' as const,
        },
    ];
    public readonly baselineFilterConfigs: BaselineFilterConfig[] = [
        ...getGenspectrumLoculusFilters({
            dateRangeOptions: fineGrainedDefaultDateRangeOptions(earliestDate),
            completenessSuffixes: [],
        }),
    ];
    public readonly useAdvancedQuery = false;
    public readonly hostField: string = GENSPECTRUM_LOCULUS_HOST_FIELD;
    public readonly authorsField = LOCULUS_AUTHORS_FIELD;
    public readonly authorAffiliationsField = LOCULUS_AUTHORS_AFFILIATIONS_FIELD;
    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = [dataOrigins.insdc];
    public readonly accessionDownloadFields = INFLUENZA_ACCESSION_DOWNLOAD_FIELDS;
    public readonly mutationAnnotations: MutationAnnotation[] = [];

    public get aggregatedVisualizations() {
        return getGenSpectrumLoculusAggregatedVisualizations(this, {
            sublineages: {
                label: 'Subtypes',
                fields: [SUBTYPE_HA_FIELD_NAME, SUBTYPE_NA_FIELD_NAME],
                views: [views.bar, views.table],
            },
        });
    }

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.influenzaA.lapis.mainDateField;
        this.additionalFilters = organismsConfig.influenzaA.lapis.additionalFilters;
    }
}

const defaultDatasetFilter: DatasetFilter = {
    locationFilters: {},
    textFilters: {},
    dateFilters: {
        [GENSPECTRUM_LOCULUS_MAIN_FILTER_DATE_COLUMN]: dateRangeOptionPresets().lastYear,
    },
    numberFilters: {},
};

export class InfluenzaACompareSideBySideView extends BaseView<
    CompareSideBySideData,
    InfluenzaAConstants,
    CompareSideBySideStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new InfluenzaAConstants(organismsConfig);
        const defaultPageState = makeCompareSideBySideData(defaultDatasetFilter, [
            {
                lineages: {
                    [SUBTYPE_HA_FIELD_NAME]: 'H5',
                    [SUBTYPE_NA_FIELD_NAME]: 'N1',
                },
            },
            {
                lineages: {
                    [SUBTYPE_HA_FIELD_NAME]: 'H3',
                    [SUBTYPE_NA_FIELD_NAME]: 'N2',
                },
            },
        ]);

        super(
            constants,
            new CompareSideBySideStateHandler(constants, defaultPageState),
            compareSideBySideViewConstants,
        );
    }
}

export class InfluenzaASequencingEffortsView extends GenericSequencingEffortsView<InfluenzaAConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new InfluenzaAConstants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}
