import { views, type AggregateView } from '@genspectrum/dashboard-components/util';

import { pathoplexusGroupNameField } from './View.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import type { Organism } from '../types/Organism.ts';
import type { DataOrigin } from '../types/dataOrigins.ts';

export interface OrganismConstants {
    readonly organism: Organism;
    readonly dataOrigins: DataOrigin[];
    readonly accessionDownloadFields: string[];
}

export const ComponentHeight = {
    large: '600px',
    small: '300px',
} as const;

export interface AdditionalSequencingEffortsField {
    readonly label: string;
    readonly fields: string[];
    readonly height: (typeof ComponentHeight)[keyof typeof ComponentHeight];
    readonly views: AggregateView[];
}

export interface ExtendedConstants extends OrganismConstants {
    readonly mainDateField: string;
    readonly additionalFilters: Record<string, string> | undefined;
    readonly additionalSequencingEffortsFields: AdditionalSequencingEffortsField[];
    readonly useAdvancedQuery: boolean;
    readonly locationFields: string[];
    readonly baselineFilterConfigs: BaselineFilterConfig[];
    readonly lineageFilters: LineageFilterConfig[];
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
                      height: ComponentHeight.large,
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
                      height: ComponentHeight.large,
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
            height: ComponentHeight.small,
            views: [views.table],
        },
        ...getAuthorRelatedSequencingEffortsFields(constants),
        {
            label: 'Collection device',
            fields: ['collectionDevice'],
            height: ComponentHeight.small,
            views: [views.table, views.bar],
        },
        {
            label: 'Collection method',
            fields: ['collectionMethod'],
            height: ComponentHeight.small,
            views: [views.table, views.bar],
        },
        {
            label: 'Purpose of sampling',
            fields: ['purposeOfSampling'],
            height: ComponentHeight.small,
            views: [views.table, views.bar],
        },
        {
            label: 'Sample type',
            fields: ['sampleType'],
            height: ComponentHeight.small,
            views: [views.table, views.bar],
        },
        {
            label: 'Amplicon PCR primer scheme',
            fields: ['ampliconPcrPrimerScheme'],
            height: ComponentHeight.small,
            views: [views.table, views.bar],
        },
        {
            label: 'Sequencing protocol',
            fields: ['sequencingProtocol'],
            height: ComponentHeight.small,
            views: [views.table, views.bar],
        },
    ];
}
