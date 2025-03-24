import { dateRangeOptionPresets, type MutationAnnotation } from '@genspectrum/dashboard-components/util';

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
    GENPSECTRUM_LOCULUS_HOST_FIELD,
    GENSPECTRUM_LOCULUS_LOCATION_FIELDS,
    getAuthorRelatedSequencingEffortsFields,
    getGenspectrumLoculusFilters,
    INFLUENZA_ACCESSION_DOWNLOAD_FIELDS,
    LOCULUS_AUTHORS_AFFILIATIONS_FIELD,
    LOCULUS_AUTHORS_FIELD,
    type OrganismConstants,
} from './OrganismConstants.ts';
import { compareSideBySideViewConstants } from './ViewConstants.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { organismConfig, Organisms } from '../types/Organism.ts';
import { type DataOrigin, dataOrigins } from '../types/dataOrigins.ts';
import { CompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';
import { fineGrainedDefaultDateRangeOptions } from '../util/defaultDateRangeOption.ts';

const earliestDate = '1905-01-01';

class InfluenzaAConstants implements OrganismConstants {
    public readonly organism = Organisms.influenzaA;
    public readonly earliestDate = earliestDate;
    public readonly mainDateField: string;
    public readonly locationFields = GENSPECTRUM_LOCULUS_LOCATION_FIELDS;
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: 'subtypeHA',
            placeholderText: 'HA subtype',
            filterType: 'text' as const,
        },
        {
            lapisField: 'subtypeNA',
            placeholderText: 'NA subtype',
            filterType: 'text' as const,
        },
    ];
    public readonly baselineFilterConfigs: BaselineFilterConfig[] = [
        ...getGenspectrumLoculusFilters({
            dateRangeOptions: fineGrainedDefaultDateRangeOptions,
            earliestDate,
        }),
    ];
    public readonly useAdvancedQuery = false;
    public readonly hostField: string = GENPSECTRUM_LOCULUS_HOST_FIELD;
    public readonly authorsField = LOCULUS_AUTHORS_FIELD;
    public readonly authorAffiliationsField = LOCULUS_AUTHORS_AFFILIATIONS_FIELD;
    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = [dataOrigins.insdc];
    public readonly accessionDownloadFields = INFLUENZA_ACCESSION_DOWNLOAD_FIELDS;
    public readonly mutationAnnotations: MutationAnnotation[] = [];

    public get additionalSequencingEffortsFields() {
        return getAuthorRelatedSequencingEffortsFields(this);
    }

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.influenzaA.lapis.mainDateField;
        this.additionalFilters = organismsConfig.influenzaA.lapis.additionalFilters;
    }
}

const defaultDatasetFilter: DatasetFilter = {
    location: {},
    textFilters: {},
    dateFilters: {
        [GENSPECTRUM_LOCULUS_MAIN_FILTER_DATE_COLUMN]: dateRangeOptionPresets.lastYear,
    },
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
                    subtypeHA: 'H5',
                    subtypeNA: 'N1',
                },
            },
            {
                lineages: {
                    subtypeHA: 'H3',
                    subtypeNA: 'N2',
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

export class InfluenzaASequencingEffortsView extends GenericSequencingEffortsView<InfluenzaAConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new InfluenzaAConstants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}
