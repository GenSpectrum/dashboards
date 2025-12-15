import type { DateRangeOption, SequenceType } from '@genspectrum/dashboard-components/util';

import type { ResistanceMutationSet } from './resistanceMutations';

/**
 * All config settings for a W-ASAP dashboard page.
 */
export type WasapPageConfig = WasapPageConfigBase & AnalysisModeConfigs;

/**
 * Base settings that apply to all modes.
 */
export type WasapPageConfigBase = {
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

    lapisBaseUrl: string;
    samplingDateField: string;
    locationNameField: string;

    defaultLocationName: string;

    browseDataUrl: string;
    browseDataDescription: string;
};

/**
 * Mode dependent settings. Always contains a config setting called <modeName>AnalysisModeEnabled.
 * If the mode is enabled, the type also contains mode dependent settings, like extra fetch settings
 * or mode default configs.
 */
type AnalysisModeConfigs = ManualAnalysisModeConfig &
    VariantAnalysisModeConfig &
    ResistanceAnalysisModeConfig &
    UntrackedAnalyisModeConfig;

type ManualAnalysisModeConfig =
    | {
          manualAnalysisModeEnabled?: never;
      }
    | {
          manualAnalysisModeEnabled: true;
          filterDefaults: {
              manual: WasapManualFilter;
          };
      };

type VariantAnalysisModeConfig =
    | {
          variantAnalysisModeEnabled?: never;
      }
    | {
          variantAnalysisModeEnabled: true;
          clinicalLapis: {
              lapisBaseUrl: string;
              dateField: string;
              lineageField: string;
          };
          filterDefaults: {
              variant: WasapVariantFilter;
          };
      };

type ResistanceAnalysisModeConfig =
    | {
          resistanceAnalysisModeEnabled?: never;
      }
    | {
          resistanceAnalysisModeEnabled: true;
          resistanceMutationSets: ResistanceMutationSet[];
          filterDefaults: {
              resistance: WasapResistanceFilter;
          };
      };

type UntrackedAnalyisModeConfig =
    | {
          untrackedAnalysisModeEnabled?: never;
      }
    | {
          untrackedAnalysisModeEnabled: true;
          clinicalLapis: {
              lapisBaseUrl: string;
              cladeField: string;
              lineageField: string;
          };
          filterDefaults: {
              untracked: WasapUntrackedFilter;
          };
      };

/**
 * Convenience function to get the list of enabled modes.
 */
export function enabledAnalysisModes(config: WasapPageConfig): WasapAnalysisMode[] {
    const result: WasapAnalysisMode[] = [];
    if (config.manualAnalysisModeEnabled) {
        result.push('manual');
    }
    if (config.variantAnalysisModeEnabled) {
        result.push('variant');
    }
    if (config.resistanceAnalysisModeEnabled) {
        result.push('resistance');
    }
    if (config.untrackedAnalysisModeEnabled) {
        result.push('untracked');
    }
    return result;
}

/**
 * URL templates containing the placeholder '{{mutation}}', which are used to construct
 * URLs to mutations in the mutations-over-time component.
 */
export type LinkTemplate = {
    nucleotideMutation: string;
    aminoAcidMutation: string;
};

export type WasapAnalysisMode = 'manual' | 'variant' | 'resistance' | 'untracked';

/**
 * Contains mode-independent settings, like the filter for location and date range.
 */
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

export const VARIANT_TIME_FRAME = {
    all: 'all',
    sixMonths: '6months',
    threeMonths: '3months',
} as const;

export type VariantTimeFrame = (typeof VARIANT_TIME_FRAME)[keyof typeof VARIANT_TIME_FRAME];

export type WasapVariantFilter = {
    mode: 'variant';
    sequenceType: SequenceType;
    variant?: string;
    minProportion: number;
    minCount: number;
    minJaccard: number;
    timeFrame: VariantTimeFrame;
};

export type WasapResistanceFilter = {
    mode: 'resistance';
    sequenceType: 'amino acid'; // resistance sets are only defined for amino acid mutations
    resistanceSet?: string;
};

export type ExcludeSetName = 'predefined' | 'custom';

export type WasapUntrackedFilter = {
    mode: 'untracked';
    sequenceType: SequenceType;
    excludeSet?: ExcludeSetName;
    excludeVariants?: string[];
};

export type WasapAnalysisFilter = WasapManualFilter | WasapVariantFilter | WasapResistanceFilter | WasapUntrackedFilter;

export type WasapFilter = {
    base: WasapBaseFilter;
    analysis: WasapAnalysisFilter;
};
