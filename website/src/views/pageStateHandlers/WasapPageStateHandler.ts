import { type SequenceType, type DateRangeOption } from '@genspectrum/dashboard-components/util';

import { type PageStateHandler } from './PageStateHandler';
import { parseDateRangesFromUrl, setSearchFromDateRange } from './dateFilterFromToUrl';
import { parseTextFiltersFromUrl } from './textFilterFromToUrl';
import { type BaselineFilterConfig } from '../../components/pageStateSelectors/BaselineSelector';
import { resistanceSetNames, type ResistanceSetName } from '../../components/views/wasap/resistanceMutations';
import { CustomDateRangeLabel } from '../../types/DateWindow';
import { wastewaterConfig } from '../../types/wastewaterConfig';
import { formatUrl } from '../../util/formatUrl';
import { setSearchFromString } from '../helpers';

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
    mutations?: string[];
};

export type WasapVariantFilter = {
    mode: 'variant';
    sequenceType: SequenceType;
    variant?: string;
    minProportion: number;
    minCount: number;
};

export type WasapResistanceFilter = {
    mode: 'resistance';
    sequenceType: 'amino acid'; // resistance sets are only defined for amino acid mutations
    resistanceSet: ResistanceSetName;
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

const wasapFilterConfig: BaselineFilterConfig[] = [
    {
        type: 'text',
        lapisField: 'location_name',
    },
    {
        type: 'date',
        dateColumn: wastewaterConfig.wasap.samplingDateField,
        dateRangeOptions: () => [],
    },
    // below are not really LAPIS fields, but we still want to use the URL parsing mechanism
    {
        type: 'text',
        lapisField: 'granularity',
    },
    {
        type: 'text',
        lapisField: 'excludeEmpty',
    },
    {
        type: 'text',
        lapisField: 'analysisMode',
    },
    {
        type: 'text',
        lapisField: 'sequenceType',
    },
    {
        type: 'text',
        lapisField: 'mutations',
    },
    {
        type: 'text',
        lapisField: 'variant',
    },
    {
        type: 'text',
        lapisField: 'minProportion',
    },
    {
        type: 'text',
        lapisField: 'minCount',
    },
    {
        type: 'text',
        lapisField: 'resistanceSet',
    },
    {
        type: 'text',
        lapisField: 'excludeSet',
    },
    {
        type: 'text',
        lapisField: 'excludeVariants',
    },
];

export class WasapPageStateHandler implements PageStateHandler<WasapFilter> {
    parsePageStateFromUrl(url: URL): WasapFilter {
        const texts = parseTextFiltersFromUrl(url.searchParams, wasapFilterConfig);
        const dateRanges = parseDateRangesFromUrl(url.searchParams, wasapFilterConfig);

        const mode = (texts.analysisMode as WasapAnalysisMode | undefined) ?? 'manual';
        const sequenceType =
            (texts.sequenceType as SequenceType | undefined) ?? (mode === 'resistance' ? 'amino acid' : 'nucleotide');

        const base: WasapBaseFilter = {
            locationName: texts.location_name ?? 'Zürich (ZH)',
            samplingDate: dateRanges.sampling_date,
            granularity: texts.granularity ?? 'day',
            excludeEmpty: texts.excludeEmpty !== 'false',
        };

        let analysis: WasapAnalysisFilter;

        switch (mode) {
            case 'manual':
                analysis = {
                    mode,
                    sequenceType,
                    mutations: texts.mutations?.split('|'),
                };
                break;
            case 'variant':
                analysis = {
                    mode,
                    sequenceType,
                    variant: texts.variant ?? 'JN.8',
                    minProportion: Number(texts.minProportion ?? '0.05'),
                    minCount: Number(texts.minCount ?? '5'),
                };
                break;
            case 'resistance':
                analysis = {
                    mode,
                    sequenceType: 'amino acid',
                    resistanceSet:
                        (texts.resistanceSet as ResistanceSetName | undefined) ?? resistanceSetNames.ThreeCLPro,
                };
                break;
            case 'untracked':
                analysis = {
                    mode,
                    sequenceType,
                    excludeSet: (texts.excludeSet as ExcludeSetName | undefined) ?? 'nextstrain',
                    excludeVariants: texts.excludeVariants?.split('|'),
                };
                break;
        }

        return { base, analysis };
    }

    toUrl(pageState: WasapFilter): string {
        const search = new URLSearchParams();
        const { base, analysis } = pageState;

        // general dataset settings
        setSearchFromString(search, 'location_name', base.locationName);
        // Force the date range to always use the Custom label for URL serialization
        const customDateRange = base.samplingDate ? { ...base.samplingDate, label: CustomDateRangeLabel } : undefined;
        setSearchFromDateRange(search, wastewaterConfig.wasap.samplingDateField, customDateRange);
        setSearchFromString(search, 'granularity', base.granularity);
        if (!base.excludeEmpty) {
            setSearchFromString(search, 'excludeEmpty', 'false');
        }

        // analysis mode dependent settings
        setSearchFromString(search, 'analysisMode', analysis.mode);
        switch (analysis.mode) {
            case 'manual':
                setSearchFromString(search, 'sequenceType', analysis.sequenceType);
                setSearchFromString(search, 'mutations', analysis.mutations?.join('|'));
                break;
            case 'variant':
                setSearchFromString(search, 'sequenceType', analysis.sequenceType);
                setSearchFromString(search, 'variant', analysis.variant);
                setSearchFromString(search, 'minProportion', String(analysis.minProportion));
                setSearchFromString(search, 'minCount', String(analysis.minCount));
                break;
            case 'resistance':
                setSearchFromString(search, 'resistanceSet', analysis.resistanceSet);
                break;
            case 'untracked':
                setSearchFromString(search, 'sequenceType', analysis.sequenceType);
                setSearchFromString(search, 'excludeSet', analysis.excludeSet);
                if (analysis.excludeSet === 'custom') {
                    setSearchFromString(search, 'excludeVariants', analysis.excludeVariants?.join('|'));
                }
                break;
        }

        return formatUrl(wastewaterConfig.pages.covid.path, search);
    }

    getDefaultPageUrl(): string {
        return wastewaterConfig.pages.covid.path;
    }
}

export const defaultManualFilter: WasapManualFilter = {
    mode: 'manual',
    sequenceType: 'nucleotide',
};

export const defaultVariantFilter: WasapVariantFilter = {
    mode: 'variant',
    sequenceType: 'nucleotide',
    minProportion: 0.05,
    minCount: 5,
};

export const defaultResistanceFilter: WasapResistanceFilter = {
    mode: 'resistance',
    sequenceType: 'amino acid',
    resistanceSet: resistanceSetNames.ThreeCLPro,
};

export const defaultUntrackedFilter: WasapUntrackedFilter = {
    mode: 'untracked',
    sequenceType: 'nucleotide',
    excludeSet: 'nextstrain',
};
