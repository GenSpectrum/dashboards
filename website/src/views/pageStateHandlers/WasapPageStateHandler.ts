import { type SequenceType, type DateRangeOption } from '@genspectrum/dashboard-components/util';

import { type PageStateHandler } from './PageStateHandler';
import { parseDateRangesFromUrl, setSearchFromDateRange } from './dateFilterFromToUrl';
import { parseTextFiltersFromUrl } from './textFilterFromToUrl';
import { type BaselineFilterConfig } from '../../components/pageStateSelectors/BaselineSelector';
import { resistanceSetNames, type ResistanceSetName } from '../../components/views/wasap/resistanceMutations';
import { wastewaterConfig } from '../../types/wastewaterConfig';
import { formatUrl } from '../../util/formatUrl';
import { weeklyAndMonthlyDateRangeOptions } from '../../util/weeklyAndMonthlyDateRangeOption';
import { setSearchFromString } from '../helpers';

export const wasapDateRangeOptions = weeklyAndMonthlyDateRangeOptions('2025-03-01');

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

export type WasapUntrackedFilter = {
    mode: 'untracked';
    sequenceType: SequenceType;
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
        dateColumn: 'sampling_date',
        dateRangeOptions: wasapDateRangeOptions,
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
            locationName: texts.location_name,
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
                    excludeVariants: texts.excludeVariants?.split('|') ?? defaultExcludeVariants,
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
        setSearchFromDateRange(search, 'sampling_date', base.samplingDate);
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
                setSearchFromString(search, 'excludeVariants', analysis.excludeVariants?.join('|'));
                break;
        }

        return formatUrl(wastewaterConfig.pages.covid.path, search);
    }

    getDefaultPageUrl(): string {
        return wastewaterConfig.pages.covid.path;
    }
}

const defaultExcludeVariants = [
    'JN.1',
    'KP.2',
    'KP.3',
    'LP.8',
    'XEC',
    'B.1.1.7',
    'B.1.351',
    'B.1.617.2',
    'P.1',
    'B.1.617.1',
    'NB.1.8.1',
    'BA.1',
    'BA.2.12.1',
    'BA.2.75.2',
    'BA.2.75',
    'BA.2.86',
    'BA.2',
    'BA.4',
    'BA.5',
    'BQ.1.1',
    'EG.5',
    'XBB.1.16',
    'XBB.1.5',
    'XBB.2.3',
    'XBB',
    'XBB.1.9',
    'XFG',
];

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
    excludeVariants: defaultExcludeVariants,
};
