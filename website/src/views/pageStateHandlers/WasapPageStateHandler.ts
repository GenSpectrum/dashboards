import { type SequenceType } from '@genspectrum/dashboard-components/util';

import { type PageStateHandler } from './PageStateHandler';
import { parseDateRangesFromUrl, setSearchFromDateRange } from './dateFilterFromToUrl';
import { parseTextFiltersFromUrl } from './textFilterFromToUrl';
import { type BaselineFilterConfig } from '../../components/pageStateSelectors/BaselineSelector';
import {
    enabledAnalysisModes,
    type ExcludeSetName,
    type WasapAnalysisFilter,
    type WasapAnalysisMode,
    type WasapBaseFilter,
    type WasapFilter,
    type WasapPageConfig,
} from '../../components/views/wasap/wasapPageConfig';
import { CustomDateRangeLabel } from '../../types/DateWindow';
import { formatUrl } from '../../util/formatUrl';
import { setSearchFromString } from '../helpers';

export class WasapPageStateHandler implements PageStateHandler<WasapFilter> {
    private readonly config: WasapPageConfig;
    private readonly filterConfig: BaselineFilterConfig[];

    constructor(config: WasapPageConfig) {
        this.config = config;
        this.filterConfig = generateWasapFilterConfig(config);
    }

    parsePageStateFromUrl(url: URL): WasapFilter {
        // URL-parsed settings
        const texts = parseTextFiltersFromUrl(url.searchParams, this.filterConfig);
        const dateRanges = parseDateRangesFromUrl(url.searchParams, this.filterConfig);
        const providedSequenceType = texts.sequenceType as SequenceType | undefined;
        const providedMode = texts.analysisMode as WasapAnalysisMode | undefined;

        // config provided defaults
        const defaultMode = enabledAnalysisModes(this.config)[0];

        const mode = providedMode ?? defaultMode;

        let analysis: WasapAnalysisFilter;

        switch (mode) {
            case 'manual':
                if (!this.config.manualAnalysisModeEnabled) {
                    throw Error("The 'manual' analysis mode is not enabled.");
                }
                analysis = {
                    mode,
                    sequenceType: providedSequenceType ?? this.config.filterDefaults.manual.sequenceType,
                    mutations: texts.mutations?.split('|'),
                };
                break;
            case 'variant':
                if (!this.config.variantAnalysisModeEnabled) {
                    throw Error("The 'variant' analysis mode is not enabled.");
                }
                analysis = {
                    mode,
                    sequenceType: providedSequenceType ?? this.config.filterDefaults.variant.sequenceType,
                    variant: texts.variant ?? this.config.filterDefaults.variant.variant,
                    minProportion: Number(texts.minProportion ?? this.config.filterDefaults.variant.minProportion),
                    minCount: Number(texts.minCount ?? this.config.filterDefaults.variant.minCount),
                    minJaccard: Number(texts.minJaccard ?? this.config.filterDefaults.variant.minJaccard),
                };
                break;
            case 'resistance':
                if (!this.config.resistanceAnalysisModeEnabled) {
                    throw Error("The 'resistance' analysis mode is not enabled.");
                }
                analysis = {
                    mode,
                    sequenceType: 'amino acid',
                    resistanceSet: texts.resistanceSet ?? this.config.filterDefaults.resistance.resistanceSet,
                };
                break;
            case 'untracked':
                if (!this.config.untrackedAnalysisModeEnabled) {
                    throw Error("The 'untracked' analysis mode is not enabled.");
                }
                analysis = {
                    mode,
                    sequenceType: providedSequenceType ?? this.config.filterDefaults.untracked.sequenceType,
                    excludeSet:
                        (texts.excludeSet as ExcludeSetName | undefined) ??
                        this.config.filterDefaults.untracked.excludeSet,
                    excludeVariants: texts.excludeVariants?.split('|'),
                };
                break;
        }

        const base: WasapBaseFilter = {
            locationName: texts.locationName ?? this.config.defaultLocationName,
            samplingDate: dateRanges.samplingDate,
            granularity: texts.granularity ?? 'day',
            excludeEmpty: texts.excludeEmpty !== 'false',
        };

        return { base, analysis };
    }

    toUrl(pageState: WasapFilter): string {
        const search = new URLSearchParams();
        const { base, analysis } = pageState;

        // general dataset settings
        setSearchFromString(search, this.config.locationNameField, base.locationName);
        // Force the date range to always use the Custom label for URL serialization
        const customDateRange = base.samplingDate ? { ...base.samplingDate, label: CustomDateRangeLabel } : undefined;
        setSearchFromDateRange(search, this.config.samplingDateField, customDateRange);
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
                setSearchFromString(search, 'minJaccard', String(analysis.minJaccard));
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

        return formatUrl(this.config.path, search);
    }

    getDefaultPageUrl(): string {
        return this.config.path;
    }
}

function generateWasapFilterConfig(pageConfig: WasapPageConfig): BaselineFilterConfig[] {
    return [
        {
            type: 'text',
            lapisField: pageConfig.locationNameField,
        },
        {
            type: 'date',
            dateColumn: pageConfig.samplingDateField,
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
            lapisField: 'minJaccard',
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
}
