import {
    type AggregateView,
    type DateRangeOption,
    type MutationAnnotation,
    views,
} from '@genspectrum/dashboard-components/util';

import {
    GENSPECTRUM_LOCULUS_MAIN_FILTER_DATE_COLUMN,
    PATHOPLEXUS_MAIN_FILTER_DATE_COLUMN,
    pathoplexusGroupNameField,
    type VariantFilter,
} from './View.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import type { Organism } from '../types/Organism.ts';
import type { DataOrigin } from '../types/dataOrigins.ts';

export interface OrganismConstants {
    readonly organism: Organism;
    readonly dataOrigins: DataOrigin[];
    readonly accessionDownloadFields: string[];
    readonly mainDateField: string;
    readonly additionalFilters: Record<string, string> | undefined;
    readonly additionalSequencingEffortsFields: AdditionalSequencingEffortsField[];
    readonly useAdvancedQuery: boolean;
    readonly locationFields: string[];
    readonly baselineFilterConfigs: BaselineFilterConfig[];
    readonly lineageFilters: LineageFilterConfig[];
    readonly predefinedVariants?: VariantFilter[];
    readonly mutationAnnotations?: MutationAnnotation[];
}

export const ComponentHeight = {
    large: '600px',
    small: '300px',
} as const;

export interface AdditionalSequencingEffortsField {
    readonly label: string;
    readonly fields: string[];
    readonly height?: (typeof ComponentHeight)[keyof typeof ComponentHeight];
    readonly views: AggregateView[];
}

export function getAuthorRelatedSequencingEffortsFields(constants: {
    authorsField: string | undefined;
    authorAffiliationsField: string | undefined;
}): AdditionalSequencingEffortsField[] {
    const authorAffiliations =
        constants.authorAffiliationsField === undefined
            ? []
            : [
                  {
                      label: 'Author affiliations',
                      fields: [constants.authorAffiliationsField],
                      views: [views.table],
                  },
              ];
    const authors =
        constants.authorsField === undefined || constants.authorAffiliationsField === undefined
            ? []
            : [
                  {
                      label: 'Authors',
                      fields: [constants.authorsField, constants.authorAffiliationsField],
                      views: [views.table],
                  },
              ];
    return [...authorAffiliations, ...authors];
}

export function getPathoplexusAdditionalSequencingEffortsFields(
    constants: Parameters<typeof getAuthorRelatedSequencingEffortsFields>[0],
): AdditionalSequencingEffortsField[] {
    return [
        {
            label: 'Pathoplexus submitting groups',
            fields: [pathoplexusGroupNameField],
            views: [views.table],
        },
        ...getAuthorRelatedSequencingEffortsFields(constants),
        {
            label: 'Collection device',
            fields: ['collectionDevice'],
            views: [views.table, views.bar],
        },
        {
            label: 'Collection method',
            fields: ['collectionMethod'],
            views: [views.table, views.bar],
        },
        {
            label: 'Purpose of sampling',
            fields: ['purposeOfSampling'],
            views: [views.table, views.bar],
        },
        {
            label: 'Sample type',
            fields: ['sampleType'],
            views: [views.table, views.bar],
        },
        {
            label: 'Amplicon PCR primer scheme',
            fields: ['ampliconPcrPrimerScheme'],
            views: [views.table, views.bar],
        },
        {
            label: 'Sequencing protocol',
            fields: ['sequencingProtocol'],
            views: [views.table, views.bar],
        },
    ];
}

export const PATHOPLEXUS_COMMON_DOWNLOAD_FIELDS = [
    'accessionVersion',
    'dataUseTerms',
    'dataUseTermsUrl',
    'dataUseTermsRestrictedUntil',
];
export const PATHOPLEXUS_ACCESSION_DOWNLOAD_FIELDS = ['insdcAccessionFull', ...PATHOPLEXUS_COMMON_DOWNLOAD_FIELDS];

export const LOCULUS_AUTHORS_FIELD = 'authors';
export const LOCULUS_AUTHORS_AFFILIATIONS_FIELD = 'authorAffiliations';

export const PATHOPLEXUS_LOCATION_FIELDS = ['geoLocCountry', 'geoLocAdmin1'];
export const GENSPECTRUM_LOCULUS_LOCATION_FIELDS = ['country', 'division'];

export const INFLUENZA_ACCESSION_DOWNLOAD_FIELDS = [
    'insdcAccessionFull_seg1',
    'insdcAccessionFull_seg2',
    'insdcAccessionFull_seg3',
    'insdcAccessionFull_seg4',
    'insdcAccessionFull_seg5',
    'insdcAccessionFull_seg6',
    'insdcAccessionFull_seg7',
    'insdcAccessionFull_seg8',
];

export const PATHOPLEXUS_HOST_FIELD = 'hostNameScientific';

export function getPathoplexusFilters({
    dateRangeOptions,
    earliestDate,
}: {
    dateRangeOptions: DateRangeOption[];
    earliestDate: string;
}): BaselineFilterConfig[] {
    return [
        {
            type: 'date',
            dateRangeOptions,
            earliestDate,
            dateColumn: PATHOPLEXUS_MAIN_FILTER_DATE_COLUMN,
            label: 'Sample collection date',
        },
        {
            lapisField: PATHOPLEXUS_HOST_FIELD,
            placeholderText: 'Host',
            type: 'text' as const,
            label: 'Host',
        },
        {
            lapisField: 'groupName',
            placeholderText: 'Group name',
            type: 'text' as const,
            label: 'Group name',
        },
        {
            type: 'date',
            dateRangeOptions,
            earliestDate: '1956-01-01',
            dateColumn: 'earliestReleaseDate',
            label: 'Earliest release date',
        },
        {
            lapisField: 'dataUseTerms',
            placeholderText: 'Data use terms',
            type: 'text' as const,
            label: 'Data use terms',
        },
    ];
}

export const GENPSECTRUM_LOCULUS_HOST_FIELD = 'hostNameScientific';

export function getGenspectrumLoculusFilters({
    dateRangeOptions,
    earliestDate,
}: {
    dateRangeOptions: DateRangeOption[];
    earliestDate: string;
}): BaselineFilterConfig[] {
    return [
        {
            type: 'date',
            dateRangeOptions,
            earliestDate,
            dateColumn: GENSPECTRUM_LOCULUS_MAIN_FILTER_DATE_COLUMN,
            label: 'Sample collection date',
        },
        {
            lapisField: GENPSECTRUM_LOCULUS_HOST_FIELD,
            placeholderText: 'Host',
            type: 'text' as const,
            label: 'Host',
        },
        {
            type: 'date',
            dateRangeOptions,
            earliestDate,
            dateColumn: 'ncbiReleaseDate',
            label: 'NCBI release date',
        },
    ];
}
