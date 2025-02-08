import type { DateRangeOption } from '@genspectrum/dashboard-components/util';

import { pathoplexusGroupNameField } from './View.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import type { Organism } from '../types/Organism.ts';
import type { DataOrigin } from '../types/dataOrigins.ts';

/**
 * Organism constants are values describing an organism, that are then used as parameters for setting up
 * a view for that organism (XX how?).
 */
export interface OrganismConstants {
    readonly organism: Organism;
    readonly dataOrigins: DataOrigin[];
    /** XX what is this? */
    readonly accessionDownloadFields: string[];
}

export const ComponentHeight = {
    large: '600px',
    small: '300px',
} as const;

/**
 * XX, used in mbox and westNile views
 */
export interface AdditionalSequencingEffortsField {
    readonly label: string;
    readonly fields: string[];
    readonly height: (typeof ComponentHeight)[keyof typeof ComponentHeight];
}

/**
 * XX, used in all(?) views
 */
export interface ExtendedConstants extends OrganismConstants {
    readonly locationFields: string[];
    readonly mainDateField: string;
    readonly dateRangeOptions: DateRangeOption[];
    readonly defaultDateRange: DateRangeOption;
    readonly additionalFilters: Record<string, string> | undefined;
    readonly additionalSequencingEffortsFields: AdditionalSequencingEffortsField[];
    readonly lineageFilters: LineageFilterConfig[];
    readonly useAdvancedQuery: boolean;
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
        },
        ...getAuthorRelatedSequencingEffortsFields(constants),
        { label: 'Collection device', fields: ['collectionDevice'], height: ComponentHeight.small },
        { label: 'Collection method', fields: ['collectionMethod'], height: ComponentHeight.small },
        { label: 'Purpose of sampling', fields: ['purposeOfSampling'], height: ComponentHeight.small },
        { label: 'Sample type', fields: ['sampleType'], height: ComponentHeight.small },
        {
            label: 'Amplicon PCR primer scheme',
            fields: ['ampliconPcrPrimerScheme'],
            height: ComponentHeight.small,
        },
        { label: 'Sequencing protocol', fields: ['sequencingProtocol'], height: ComponentHeight.small },
    ];
}
