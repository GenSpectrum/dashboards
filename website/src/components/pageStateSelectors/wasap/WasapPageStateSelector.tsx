import { useQuery } from '@tanstack/react-query';
import { type Dispatch, type SetStateAction, useState } from 'react';

import { ApplyFilterButton } from '../ApplyFilterButton';
import { DynamicDateFilter } from '../DynamicDateFilter';
import { SelectorHeadline } from '../SelectorHeadline';
import { ExplorationModeInfo } from './InfoBlocks';
import { CollectionAnalysisFilter } from './filters/CollectionAnalysisFilter';
import { ManualAnalysisFilter } from './filters/ManualAnalysisFilter';
import { ResistanceMutationsFilter } from './filters/ResistanceMutationsFilter';
import { UntrackedFilter } from './filters/UntrackedFilter';
import { VariantExplorerFilter } from './filters/VariantExplorerFilter';
import { LabeledField } from './utils/LabeledField';
import { RadioSelect } from './utils/RadioSelect';
import { getCladeLineages } from '../../../lapis/getCladeLineages';
import { Inset } from '../../../styles/Inset';
import { recentDaysDateRangeOptions } from '../../../util/recentDaysDateRangeOptions';
import { type PageStateHandler } from '../../../views/pageStateHandlers/PageStateHandler';
import { GsTextFilter } from '../../genspectrum/GsTextFilter';
import {
    enabledAnalysisModes,
    type WasapAnalysisFilter,
    type WasapAnalysisMode,
    type WasapBaseFilter,
    type WasapFilter,
    type WasapPageConfig,
} from '../../views/wasap/wasapPageConfig';

/**
 * The root filter control for the W-ASAP dashboard.
 * Uses sub filter components for the different modes, in the 'filters' directory.
 */
export function WasapPageStateSelector({
    config,
    pageStateHandler,
    initialBaseFilterState,
    initialAnalysisFilterState,
    setPageState,
}: {
    config: WasapPageConfig;
    pageStateHandler: PageStateHandler<WasapFilter>;
    initialBaseFilterState: WasapBaseFilter;
    initialAnalysisFilterState: WasapAnalysisFilter;
    setPageState: Dispatch<SetStateAction<WasapFilter>>;
}) {
    const [baseFilterState, setBaseFilterState] = useState(initialBaseFilterState);

    // State for each individual analysis mode setting component
    const {
        manualFilter,
        setManualFilter,
        variantFilter,
        setVariantFilter,
        resistanceFilter,
        setResistanceFilter,
        untrackedFilter,
        setUntrackedFilter,
        collectionFilter,
        setCollectionFilter,
    } = useAnalysisFilterStates(initialAnalysisFilterState, config);

    const [selectedAnalysisMode, setSelectedAnalysisMode] = useState(initialAnalysisFilterState.mode);

    function getMergedPageState(): WasapFilter {
        // We're using the ! below because we know that for the selected mode we have a defined state.
        // based on the initialization in useAnalysisFilterStates
        /* eslint-disable  @typescript-eslint/no-non-null-assertion */
        switch (selectedAnalysisMode) {
            case 'manual':
                return { base: baseFilterState, analysis: manualFilter! };
            case 'variant':
                return { base: baseFilterState, analysis: variantFilter! };
            case 'resistance':
                return { base: baseFilterState, analysis: resistanceFilter! };
            case 'untracked':
                return { base: baseFilterState, analysis: untrackedFilter! };
            case 'collection':
                return { base: baseFilterState, analysis: collectionFilter! };
        }
        /* eslint-enable  @typescript-eslint/no-non-null-assertion */
    }

    // data for the 'untracked' analysis mode - loaded here already so it's available when the mode is selected
    const cladeLineageQueryResult = useQuery({
        enabled: config.untrackedAnalysisModeEnabled,
        queryKey: ['cladeLineages'],
        queryFn: () => {
            if (!config.untrackedAnalysisModeEnabled) {
                throw Error(
                    "This clade lineage query was called despite 'untracked' mode being disabled. This should not happen.",
                );
            }
            return getCladeLineages(
                config.clinicalLapis.lapisBaseUrl,
                config.clinicalLapis.cladeField,
                config.clinicalLapis.lineageField,
                true,
            );
        },
    });

    return (
        <div className='flex flex-col gap-4'>
            <SelectorHeadline>Filter dataset</SelectorHeadline>
            <Inset className='p-2'>
                <LabeledField label='Sampling location'>
                    <GsTextFilter
                        placeholderText='Sampling location'
                        lapisField={config.locationNameField}
                        lapisFilter={{}}
                        onInputChange={({ locationName }) => {
                            setBaseFilterState({ ...baseFilterState, locationName });
                        }}
                        value={baseFilterState.locationName}
                    />
                </LabeledField>

                <DynamicDateFilter
                    label='Sampling date'
                    lapis={config.lapisBaseUrl}
                    dateFieldName={config.samplingDateField}
                    generateOptions={recentDaysDateRangeOptions}
                    value={baseFilterState.samplingDate}
                    onChange={(newDateRange?) => setBaseFilterState({ ...baseFilterState, samplingDate: newDateRange })}
                />
                <div className='h-2' />
                <RadioSelect
                    label='Granularity'
                    value={baseFilterState.granularity}
                    options={[
                        { value: 'day', label: 'Day' },
                        { value: 'week', label: 'Week' },
                    ]}
                    onChange={(val) => setBaseFilterState({ ...baseFilterState, granularity: val })}
                />
                <div className='text-sm'>
                    <input
                        className='accent-primary'
                        type='checkbox'
                        id='excludeEmpty'
                        checked={baseFilterState.excludeEmpty}
                        onChange={(e) => setBaseFilterState({ ...baseFilterState, excludeEmpty: e.target.checked })}
                    />
                    <label htmlFor='excludeEmpty' className='pl-2'>
                        Exclude empty date ranges
                    </label>
                </div>
            </Inset>
            <SelectorHeadline info={<ExplorationModeInfo />}>Mutation selection</SelectorHeadline>

            <select
                className='select select-bordered'
                value={selectedAnalysisMode}
                onChange={(e) => {
                    setSelectedAnalysisMode(e.target.value as WasapAnalysisMode);
                }}
            >
                {enabledAnalysisModes(config).map((mode) => (
                    <option key={mode} value={mode}>
                        {modeLabel(mode)}
                    </option>
                ))}
            </select>
            <Inset className='p-2'>
                {(() => {
                    switch (selectedAnalysisMode) {
                        case 'manual':
                            if (!config.manualAnalysisModeEnabled || manualFilter === undefined) {
                                throw Error("'manual' mode selected, but it isn't enabled.");
                            }
                            return <ManualAnalysisFilter pageState={manualFilter} setPageState={setManualFilter} />;
                        case 'variant':
                            if (!config.variantAnalysisModeEnabled || variantFilter === undefined) {
                                throw Error("'variant' mode selected, but it isn't enabled.");
                            }
                            return (
                                <VariantExplorerFilter
                                    pageState={variantFilter}
                                    setPageState={setVariantFilter}
                                    clinicalSequenceLapisBaseUrl={config.clinicalLapis.lapisBaseUrl}
                                    clinicalSequenceLapisLineageField={config.clinicalLapis.lineageField}
                                />
                            );
                        case 'resistance':
                            if (!config.resistanceAnalysisModeEnabled || resistanceFilter === undefined) {
                                throw Error("'resistance' mode selected, but it isn't enabled.");
                            }
                            return (
                                <ResistanceMutationsFilter
                                    pageState={resistanceFilter}
                                    setPageState={setResistanceFilter}
                                    resistanceMutationSets={config.resistanceMutationSets}
                                />
                            );
                        case 'untracked':
                            if (!config.untrackedAnalysisModeEnabled || untrackedFilter === undefined) {
                                throw Error("'untracked' mode selected, but it isn't enabled.");
                            }
                            return (
                                <UntrackedFilter
                                    pageState={untrackedFilter}
                                    setPageState={setUntrackedFilter}
                                    clinicalSequenceLapisBaseUrl={config.clinicalLapis.lapisBaseUrl}
                                    clinicalSequenceLapisLineageField={config.clinicalLapis.lineageField}
                                    cladeLineageQueryResult={cladeLineageQueryResult}
                                />
                            );
                        case 'collection':
                            if (!config.collectionAnalysisModeEnabled || collectionFilter === undefined) {
                                throw Error("'collection' mode selected, but it isn't enabled.");
                            }
                            return (
                                <CollectionAnalysisFilter
                                    pageState={collectionFilter}
                                    setPageState={setCollectionFilter}
                                    collectionsApiBaseUrl={config.collectionsApiBaseUrl}
                                />
                            );
                    }
                })()}
            </Inset>
            <ApplyFilterButton
                pageStateHandler={pageStateHandler}
                newPageState={getMergedPageState()}
                setPageState={setPageState}
            />
        </div>
    );
}

function modeLabel(mode: WasapAnalysisMode): string {
    switch (mode) {
        case 'manual':
            return 'Manual';
        case 'resistance':
            return 'Resistance Mutations';
        case 'variant':
            return 'Variant Explorer';
        case 'untracked':
            return 'Untracked Mutations';
        case 'collection':
            return 'Collection';
    }
}

/**
 * States for each analysis filter component.
 * For the analysis mode that is given in the initial filter settings, the given values are used.
 * Else, the default filter values from the `config` are used.
 */
function useAnalysisFilterStates(initialFilter: WasapAnalysisFilter, config: WasapPageConfig) {
    const [manualFilter, setManualFilter] = useState(
        initialFilter.mode === 'manual'
            ? initialFilter
            : config.manualAnalysisModeEnabled
              ? config.filterDefaults.manual
              : undefined,
    );
    const [variantFilter, setVariantFilter] = useState(
        initialFilter.mode === 'variant'
            ? initialFilter
            : config.variantAnalysisModeEnabled
              ? config.filterDefaults.variant
              : undefined,
    );
    const [resistanceFilter, setResistanceFilter] = useState(
        initialFilter.mode === 'resistance'
            ? initialFilter
            : config.resistanceAnalysisModeEnabled
              ? config.filterDefaults.resistance
              : undefined,
    );
    const [untrackedFilter, setUntrackedFilter] = useState(
        initialFilter.mode === 'untracked'
            ? initialFilter
            : config.untrackedAnalysisModeEnabled
              ? config.filterDefaults.untracked
              : undefined,
    );
    const [collectionFilter, setCollectionFilter] = useState(
        initialFilter.mode === 'collection'
            ? initialFilter
            : config.collectionAnalysisModeEnabled
              ? config.filterDefaults.collection
              : undefined,
    );

    return {
        manualFilter,
        setManualFilter,
        variantFilter,
        setVariantFilter,
        resistanceFilter,
        setResistanceFilter,
        untrackedFilter,
        setUntrackedFilter,
        collectionFilter,
        setCollectionFilter,
    };
}
