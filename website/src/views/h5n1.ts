import { dateRangeOptionPresets, type MutationAnnotation } from '@genspectrum/dashboard-components/util';

import { type CompareSideBySideData, type DatasetAndVariantData, type Id } from './View.ts';
import type { OrganismsConfig } from '../config.ts';
import {
    BaseView,
    GenericCompareToBaselineView,
    GenericCompareVariantsView,
    GenericSequencingEffortsView,
    GenericSingleVariantView,
} from './BaseView.ts';
import { type OrganismConstants, getAuthorRelatedSequencingEffortsFields } from './OrganismConstants.ts';
import { compareSideBySideViewConstants } from './ViewConstants.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { organismConfig, Organisms } from '../types/Organism.ts';
import { type DataOrigin, dataOrigins } from '../types/dataOrigins.ts';
import { CompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';

const earliestDate = '1905-01-01';
const hostField = 'hostNameScientific';

class H5n1Constants implements OrganismConstants {
    public readonly organism = Organisms.h5n1;
    public readonly earliestDate = earliestDate;
    public readonly mainDateField: string;
    public readonly locationFields: string[];
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: 'clade',
            placeholderText: 'Clade',
            filterType: 'text' as const,
        },
    ];
    public readonly useAdvancedQuery = false;
    public readonly baselineFilterConfigs: BaselineFilterConfig[] = [
        {
            type: 'date',
            dateRangeOptions: [
                dateRangeOptionPresets.lastMonth,
                dateRangeOptionPresets.last2Months,
                dateRangeOptionPresets.last3Months,
                dateRangeOptionPresets.last6Months,
                dateRangeOptionPresets.lastYear,
                { label: 'Since 2020', dateFrom: '2020-01-01' },
                { label: '2010-2019', dateFrom: '2010-01-01', dateTo: '2019-12-31' },
                { label: '2000-2009', dateFrom: '2000-01-01', dateTo: '2009-12-31' },
                { label: 'Since 2000', dateFrom: '2000-01-01' },
                { label: 'Before 2000', dateFrom: earliestDate, dateTo: '1999-12-31' },
                { label: 'All times', dateFrom: this.earliestDate },
            ],
            earliestDate,
            defaultDateRange: dateRangeOptionPresets.lastYear,
            dateColumn: 'sampleCollectionDate',
            label: 'Sample collection date',
        },
        {
            lapisField: hostField,
            placeholderText: 'Host',
            type: 'text' as const,
            label: 'Host',
        },
    ];
    public readonly hostField: string = hostField;
    public readonly authorsField: string | undefined;
    public readonly authorAffiliationsField: string | undefined;
    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = [dataOrigins.insdc];
    public readonly accessionDownloadFields;
    public readonly predefinedVariants = [
        {
            lineages: { clade: '2.3.4.4b' },
        },
        {
            lineages: { clade: '2.3.2.1a' },
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
    // TODO: Some mutations are only of interest when with other mutations but are now marked individually (listed here without `+20` correction):
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

    public get additionalSequencingEffortsFields() {
        return getAuthorRelatedSequencingEffortsFields(this);
    }

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.h5n1.lapis.mainDateField;
        this.locationFields = organismsConfig.h5n1.lapis.locationFields;
        this.authorsField = organismsConfig.h5n1.lapis.authorsField;
        this.authorAffiliationsField = organismsConfig.h5n1.lapis.authorAffiliationsField;
        this.additionalFilters = organismsConfig.h5n1.lapis.additionalFilters;
        this.accessionDownloadFields = organismsConfig.h5n1.lapis.accessionDownloadFields;
    }
}

export class H5n1AnalyzeSingleVariantView extends GenericSingleVariantView<H5n1Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new H5n1Constants(organismsConfig));
    }
}

export class H5n1CompareSideBySideView extends BaseView<
    CompareSideBySideData,
    H5n1Constants,
    CompareSideBySideStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new H5n1Constants(organismsConfig);
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
                            lineages: {},
                            mutations: {},
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
                                clade: '2.3.4.4b',
                            },
                            mutations: {},
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

export class H5n1SequencingEffortsView extends GenericSequencingEffortsView<H5n1Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new H5n1Constants(organismsConfig));
    }
}

export class H5n1CompareVariantsView extends GenericCompareVariantsView<H5n1Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new H5n1Constants(organismsConfig));
    }
}

export class H5n1CompareToBaselineView extends GenericCompareToBaselineView<H5n1Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new H5n1Constants(organismsConfig));
    }
}
