import type { ResistanceMutationSet } from './resistanceMutations';
import type { WasapAnalysisMode } from '../../../views/pageStateHandlers/WasapPageStateHandler';

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
};
