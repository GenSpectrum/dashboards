import { type SequenceType, type DateRangeOption } from '@genspectrum/dashboard-components/util';

import { type PageStateHandler } from './PageStateHandler';
import { parseDateRangesFromUrl, setSearchFromDateRange } from './dateFilterFromToUrl';
import { parseTextFiltersFromUrl } from './textFilterFromToUrl';
import { type BaselineFilterConfig } from '../../components/pageStateSelectors/BaselineSelector';
import { wastewaterConfig } from '../../types/wastewaterConfig';
import { fineGrainedDefaultDateRangeOptions } from '../../util/defaultDateRangeOption';
import { formatUrl } from '../../util/formatUrl';
import { setSearchFromString } from '../helpers';

export const wasapDateRangeOptions = fineGrainedDefaultDateRangeOptions('2020-01-01');

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
        lapisField: 'minProportion'
    },
    {
        type: 'text',
        lapisField: 'minCount'
    },
    {
        type: 'text',
        lapisField: 'resistanceSet'
    }
];

export type WasapAnalysisMode = 'manual' | 'variant' | 'resistance' | 'untracked';

export type WasapFilter = {
    locationName?: string;
    samplingDate?: DateRangeOption;
    analysisMode: WasapAnalysisMode;
    sequenceType: SequenceType;
    mutations?: string[];
    variant: string;
    minProportion: number;
    minCount: number;
    resistanceSet: string;
};

export class WasapPageStateHandler implements PageStateHandler<WasapFilter> {
    parsePageStateFromUrl(url: URL): WasapFilter {
        const texts = parseTextFiltersFromUrl(url.searchParams, wasapFilterConfig);
        const dateRanges = parseDateRangesFromUrl(url.searchParams, wasapFilterConfig);

        return {
            locationName: texts.location_name,
            samplingDate: dateRanges.sampling_date,
            analysisMode: (texts.analysisMode as WasapAnalysisMode | undefined) ?? 'manual',
            sequenceType: (texts.sequenceType as SequenceType | undefined) ?? 'nucleotide',
            mutations: texts.mutations?.split('|'),
            variant: texts.variant ?? "JN.8",
            minProportion: Number(texts.minProportion ?? "0.05"),
            minCount: Number(texts.minCount ?? "5"),
            resistanceSet: texts.resistanceSet ?? "3CLpro",
        };
    }

    toUrl(pageState: WasapFilter): string {
        const search = new URLSearchParams();
        setSearchFromString(search, 'location_name', pageState.locationName);
        setSearchFromDateRange(search, 'sampling_date', pageState.samplingDate);
        setSearchFromString(search, 'analysisMode', pageState.analysisMode);
        setSearchFromString(search, 'sequenceType', pageState.sequenceType);
        setSearchFromString(search, 'mutations', pageState.mutations?.join('|'));
        setSearchFromString(search, 'variant', pageState.variant);
        setSearchFromString(search, 'minProportion', String(pageState.minProportion))
        setSearchFromString(search, 'minCount', String(pageState.minCount));
        setSearchFromString(search, 'resistanceSet', pageState.resistanceSet);
        return formatUrl(wastewaterConfig.pages.covid.path, search);
    }

    getDefaultPageUrl(): string {
        return wastewaterConfig.pages.covid.path;
    }
}
