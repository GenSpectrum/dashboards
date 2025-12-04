import type { DateRangeOption, SequenceType } from '@genspectrum/dashboard-components/util';

import type { ResistanceMutationSet } from './resistanceMutations';

/**
 * All config settings for a W-ASAP dashboard page.
 */
export type WasapPageConfig = {
    /**
     * The name of the organism, i.e. 'Sars-CoV-2'
     */
    name: string;

    /**
     * The path to the page itself.
     * Used to generate URLs and in the breadcrumbs.
     */
    path: string;

    /**
     * A description of the page to display in the menu.
     */
    description: string;

    /**
     * Object with templates to generate URLs to specific mutations.
     */
    linkTemplate: LinkTemplate;

    /**
     * Which modes to enable on the dashboard; the list will also define the order
     * in which the modes are shown in the dropdown menu.
     * Should not contain duplicates.
     */
    enabledAnalysisModes: WasapAnalysisMode[];

    lapisBaseUrl: string;
    samplingDateField: string;
    locationNameField: string;

    /**
     * Settings for the clinical LAPIS instance.
     * It is used to fetch mutation sets for lineages.
     */
    clinicalLapis: ClinicalLapisConfig;

    browseDataUrl: string;
    browseDataDescription: string;

    resistanceMutationSets: ResistanceMutationSet[];

    defaultLocationName: string;
    filterDefaults: FilterDefaults;
};

type FilterDefaults = {
    manual: WasapManualFilter;
    variant: WasapVariantFilter;
    resistance: WasapResistanceFilter;
    untracked: WasapUntrackedFilter;
};

/**
 * URL templates containing the placeholder '{{mutation}}', which are used to construct
 * URLs to mutations in the mutations-over-time component.
 */
export type LinkTemplate = {
    nucleotideMutation: string;
    aminoAcidMutation: string;
};

export type ClinicalLapisConfig = {
    lapisBaseUrl: string;
    cladeField: string;
    lineageField: string;
};

export type WasapAnalysisMode = 'manual' | 'variant' | 'resistance' | 'untracked';

export type WasapBaseFilter = {
    locationName?: string;
    samplingDate?: DateRangeOption;
    granularity: string;
    excludeEmpty: boolean;
};

export type WasapManualFilter = {
    mode: 'manual';
    sequenceType: SequenceType;
    /**
     * A list of mutations like A23T (nucleotide) or S:E44H (amino acid).
     * The type of mutation should match the sequenceType.
     */
    mutations?: string[];
};

export type WasapVariantFilter = {
    mode: 'variant';
    sequenceType: SequenceType;
    variant?: string;
    minProportion: number;
    minCount: number;
    minJaccard: number;
};

export type WasapResistanceFilter = {
    mode: 'resistance';
    sequenceType: 'amino acid'; // resistance sets are only defined for amino acid mutations
    resistanceSet: string;
};

export type ExcludeSetName = 'nextstrain' | 'custom';

export type WasapUntrackedFilter = {
    mode: 'untracked';
    sequenceType: SequenceType;
    excludeSet: ExcludeSetName;
    excludeVariants?: string[];
};

export type WasapAnalysisFilter = WasapManualFilter | WasapVariantFilter | WasapResistanceFilter | WasapUntrackedFilter;

export type WasapFilter = {
    base: WasapBaseFilter;
    analysis: WasapAnalysisFilter;
};
