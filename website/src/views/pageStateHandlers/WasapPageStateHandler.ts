import { type SequenceType, type DateRangeOption } from '@genspectrum/dashboard-components/util';

import { type PageStateHandler } from './PageStateHandler';
import { parseDateRangesFromUrl, setSearchFromDateRange } from './dateFilterFromToUrl';
import { parseTextFiltersFromUrl } from './textFilterFromToUrl';
import { type BaselineFilterConfig } from '../../components/pageStateSelectors/BaselineSelector';
import { resistanceSetNames, type ResistanceSetName } from '../../components/views/wasap/resistanceMutations';
import { wastewaterConfig } from '../../types/wastewaterConfig';
import { fineGrainedDefaultDateRangeOptions } from '../../util/defaultDateRangeOption';
import { formatUrl } from '../../util/formatUrl';
import { setSearchFromString } from '../helpers';

export const wasapDateRangeOptions = fineGrainedDefaultDateRangeOptions('2020-01-01');

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

export type WasapAnalysisMode = 'manual' | 'variant' | 'resistance' | 'untracked';

export type WasapFilter = {
    /**
    /* Sample collection filters
     */
    locationName?: string;
    samplingDate?: DateRangeOption;
    granularity: string;
    excludeEmpty: boolean;
    /**
     * Analysis mode settings
     */
    analysisMode: WasapAnalysisMode;
    sequenceType: SequenceType;
    mutations?: string[];
    variant?: string;
    minProportion: number;
    minCount: number;
    resistanceSet: ResistanceSetName;
    excludeVariants?: string[];
};

export class WasapPageStateHandler implements PageStateHandler<WasapFilter> {
    parsePageStateFromUrl(url: URL): WasapFilter {
        const texts = parseTextFiltersFromUrl(url.searchParams, wasapFilterConfig);
        const dateRanges = parseDateRangesFromUrl(url.searchParams, wasapFilterConfig);

        const analysisMode = (texts.analysisMode as WasapAnalysisMode | undefined) ?? 'manual';
        const sequenceType =
            (texts.sequenceType as SequenceType | undefined) ??
            (analysisMode === 'resistance' ? 'amino acid' : 'nucleotide');

        return {
            locationName: texts.location_name,
            samplingDate: dateRanges.sampling_date,
            granularity: texts.granularity ?? 'day',
            excludeEmpty: texts.excludeEmpty !== 'false',
            analysisMode,
            sequenceType,
            mutations: texts.mutations?.split('|'),
            variant: texts.variant ?? 'JN.8',
            minProportion: Number(texts.minProportion ?? '0.05'),
            minCount: Number(texts.minCount ?? '5'),
            resistanceSet: (texts.resistanceSet as ResistanceSetName | undefined) ?? resistanceSetNames.ThreeCLPro,
            excludeVariants: texts.excludeVariants?.split('|') ?? defaultExcludeVariants,
        };
    }

    toUrl(pageState: WasapFilter): string {
        const search = new URLSearchParams();
        // general dataset settings
        setSearchFromString(search, 'location_name', pageState.locationName);
        setSearchFromDateRange(search, 'sampling_date', pageState.samplingDate);
        setSearchFromString(search, 'granularity', pageState.granularity);
        if (!pageState.excludeEmpty) {
            setSearchFromString(search, 'excludeEmpty', 'false');
        }
        // analysis mode dependent settings
        setSearchFromString(search, 'analysisMode', pageState.analysisMode);
        switch (pageState.analysisMode) {
            case 'manual':
                setSearchFromString(search, 'sequenceType', pageState.sequenceType);
                setSearchFromString(search, 'mutations', pageState.mutations?.join('|'));
                break;
            case 'variant':
                setSearchFromString(search, 'sequenceType', pageState.sequenceType);
                setSearchFromString(search, 'variant', pageState.variant);
                setSearchFromString(search, 'minProportion', String(pageState.minProportion));
                setSearchFromString(search, 'minCount', String(pageState.minCount));
                break;
            case 'resistance':
                setSearchFromString(search, 'resistanceSet', pageState.resistanceSet);
                break;
            case 'untracked':
                setSearchFromString(search, 'sequenceType', pageState.sequenceType);
                setSearchFromString(search, 'excludeVariants', pageState.excludeVariants?.join('|'));
                break;
        }

        return formatUrl(wastewaterConfig.pages.covid.path, search);
    }

    getDefaultPageUrl(): string {
        return wastewaterConfig.pages.covid.path;
    }
}
