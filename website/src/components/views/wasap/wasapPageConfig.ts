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

export type WasapPageConfig = {
    /**
     * The path to the page itself.
     * Used to generate URLs and in the breadcrumbs.
     */
    path: string;

    /**
     * The name of the organism, i.e. 'Sars-CoV-2'
     */
    name: string;

    /**
     * A description of the page to display in the menu.
     */
    description: string;
    linkTemplate: LinkTemplate;
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
};
