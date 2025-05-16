import { dateRangeOptionPresets, type MutationAnnotation } from '@genspectrum/dashboard-components/util';

import {
    type CompareSideBySideData,
    type DatasetFilter,
    GENSPECTRUM_LOCULUS_MAIN_FILTER_DATE_COLUMN,
    makeCompareSideBySideData,
    makeCompareToBaselineData,
    makeCompareVariantsData,
    makeDatasetAndVariantData,
} from './View.ts';
import type { OrganismsConfig } from '../config.ts';
import {
    BaseView,
    GenericCompareToBaselineView,
    GenericCompareVariantsView,
    GenericSequencingEffortsView,
    GenericSingleVariantView,
} from './BaseView.ts';
import {
    GENSPECTRUM_LOCULUS_HOST_FIELD,
    GENSPECTRUM_LOCULUS_LOCATION_FIELDS,
    getGenSpectrumLoculusAggregatedVisualizations,
    getGenspectrumLoculusFilters,
    INFLUENZA_ACCESSION_DOWNLOAD_FIELDS,
    INFLUENZA_COMPLETENESS_SUFFIXES,
    LOCULUS_AUTHORS_AFFILIATIONS_FIELD,
    LOCULUS_AUTHORS_FIELD,
    type OrganismConstants,
} from './OrganismConstants.ts';
import { compareSideBySideViewConstants } from './ViewConstants.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { Organisms } from '../types/Organism.ts';
import { type DataOrigin, dataOrigins } from '../types/dataOrigins.ts';
import { CompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';
import { fineGrainedDefaultDateRangeOptions } from '../util/defaultDateRangeOption.ts';

const earliestDate = '1905-01-01';

const CLADE_FIELD_NAME = 'clade';

class H5n1Constants implements OrganismConstants {
    public readonly organism = Organisms.h5n1;
    public readonly earliestDate = earliestDate;
    public readonly mainDateField: string;
    public readonly locationFields = GENSPECTRUM_LOCULUS_LOCATION_FIELDS;
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: CLADE_FIELD_NAME,
            placeholderText: 'Clade',
            filterType: 'text' as const,
        },
    ];
    public readonly useAdvancedQuery = false;
    public readonly baselineFilterConfigs: BaselineFilterConfig[] = [
        ...getGenspectrumLoculusFilters({
            dateRangeOptions: fineGrainedDefaultDateRangeOptions,
            earliestDate,
            completenessSuffixes: INFLUENZA_COMPLETENESS_SUFFIXES,
        }),
    ];
    public readonly hostField: string = GENSPECTRUM_LOCULUS_HOST_FIELD;
    public readonly authorsField = LOCULUS_AUTHORS_FIELD;
    public readonly authorAffiliationsField = LOCULUS_AUTHORS_AFFILIATIONS_FIELD;
    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = [dataOrigins.insdc];
    public readonly accessionDownloadFields = INFLUENZA_ACCESSION_DOWNLOAD_FIELDS;
    public readonly predefinedVariants = [
        {
            lineages: { [CLADE_FIELD_NAME]: '2.3.4.4b' },
        },
        {
            lineages: { [CLADE_FIELD_NAME]: '2.3.2.1a' },
        },
        {
            mutations: {
                aminoAcidMutations: ['NA:V67I'],
            },
        },
    ];

    // Antiviral susceptibility mutations have been compiled here: https://www.who.int/teams/global-influenza-programme/laboratory-network/quality-assurance/antiviral-susceptibility-influenza/neuraminidase-inhibitor.
    // Here mutations are in regard to this reference: https://www.ncbi.nlm.nih.gov/nuccore/EF619973.1
    // Mutations from our reference to this reference have a deletion from NA:49-68. This means that to convert the mutations to our reference we add `20` to obtain the mutations listed below.
    // TODO(#650): Some mutations are only of interest when with other mutations but are now marked individually (listed here without `+20` correction):
    // I97V+I294V, E99A+H255Y, E99D+H255Y, E99G+H255Y, I203L+S227N, I203M+H255Y, I203V+H255Y, N295S+T438N, K130N+I203L+S227N
    public readonly mutationAnnotations: MutationAnnotation[] = [
        {
            name: 'NA amino acid substitution associated with reduced inhibition by NAIs',
            description:
                "This substitution has been associated with reduced NAI inhibition in subtype H5N1, for more details see the <a class='link' href='https://www.who.int/teams/global-influenza-programme/laboratory-network/quality-assurance/antiviral-susceptibility-influenza/neuraminidase-inhibitor'>Global Influenza Programme Report</a>.",
            symbol: '*',
            nucleotideMutations: [],
            aminoAcidMutations: [
                'NA:I223V',
                'NA:E119D',
                'NA:S247N',
                'NA:I117V',
                'NA:T458N',
                'NA:I223L',
                'NA:Q136L',
                'NA:I314V',
                'NA:E119A',
                'NA:H275Y',
                'NA:V149A',
                'NA:N295S',
                'NA:V116A',
                'NA:E119G',
                'NA:K432T',
                'NA:I223M',
                'NA:I137T',
                'NA:N315D',
                'NA:D199G',
                'NA:K150N',
                'NA:N315S',
                'NA:T458I',
                'NA:I117T',
                'NA:S267N',
            ],
        },
    ];

    public get aggregatedVisualizations() {
        return getGenSpectrumLoculusAggregatedVisualizations(this, {
            sublineages: {
                label: 'Clades',
                fields: [CLADE_FIELD_NAME],
            },
        });
    }

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.h5n1.lapis.mainDateField;
        this.additionalFilters = organismsConfig.h5n1.lapis.additionalFilters;
    }
}

const defaultDatasetFilter: DatasetFilter = {
    locationFilters: {},
    textFilters: {},
    dateFilters: {
        [GENSPECTRUM_LOCULUS_MAIN_FILTER_DATE_COLUMN]: dateRangeOptionPresets.lastYear,
    },
    numberFilters: {},
};

export class H5n1AnalyzeSingleVariantView extends GenericSingleVariantView<H5n1Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new H5n1Constants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class H5n1CompareSideBySideView extends BaseView<
    CompareSideBySideData,
    H5n1Constants,
    CompareSideBySideStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new H5n1Constants(organismsConfig);
        const defaultPageState = makeCompareSideBySideData(defaultDatasetFilter, [
            {},
            {
                lineages: {
                    [CLADE_FIELD_NAME]: '2.3.4.4b',
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

export class H5n1SequencingEffortsView extends GenericSequencingEffortsView<H5n1Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new H5n1Constants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class H5n1CompareVariantsView extends GenericCompareVariantsView<H5n1Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new H5n1Constants(organismsConfig), makeCompareVariantsData(defaultDatasetFilter));
    }
}

export class H5n1CompareToBaselineView extends GenericCompareToBaselineView<H5n1Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new H5n1Constants(organismsConfig), makeCompareToBaselineData(defaultDatasetFilter));
    }
}
