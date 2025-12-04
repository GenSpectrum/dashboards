import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { ApplyFilterButton } from '../ApplyFilterButton';
import { DynamicDateFilter } from '../DynamicDateFilter';
import { SelectorHeadline } from '../SelectorHeadline';
import { ExplorationModeInfo } from './InfoBlocks';
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
import {
    defaultManualFilter,
    defaultVariantFilter,
    defaultResistanceFilter,
    defaultUntrackedFilter,
} from '../../../views/pageStateHandlers/WasapPageStateHandler';
import { GsTextFilter } from '../../genspectrum/GsTextFilter';
import type {
    WasapAnalysisFilter,
    WasapAnalysisMode,
    WasapBaseFilter,
    WasapFilter,
    WasapPageConfig,
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
}: {
    config: WasapPageConfig;
    pageStateHandler: PageStateHandler<WasapFilter>;
    initialBaseFilterState: WasapBaseFilter;
    initialAnalysisFilterState: WasapAnalysisFilter;
}) {
    const [baseFilterState, setBaseFilterState] = useState(initialBaseFilterState);

    const [manualFilter, setManualFilter] = useState(
        initialAnalysisFilterState.mode === 'manual' ? initialAnalysisFilterState : defaultManualFilter,
    );
    const [variantFilter, setVariantFilter] = useState(
        initialAnalysisFilterState.mode === 'variant' ? initialAnalysisFilterState : defaultVariantFilter,
    );
    const [resistanceFilter, setResistanceFilter] = useState(
        initialAnalysisFilterState.mode === 'resistance' ? initialAnalysisFilterState : defaultResistanceFilter,
    );
    const [untrackedFilter, setUntrackedFilter] = useState(
        initialAnalysisFilterState.mode === 'untracked' ? initialAnalysisFilterState : defaultUntrackedFilter,
    );

    const [selectedAnalysisMode, setSelectedAnalysisMode] = useState(initialAnalysisFilterState.mode);

    function getMergedPageState(): WasapFilter {
        switch (selectedAnalysisMode) {
            case 'manual':
                return { base: baseFilterState, analysis: manualFilter };
            case 'variant':
                return { base: baseFilterState, analysis: variantFilter };
            case 'resistance':
                return { base: baseFilterState, analysis: resistanceFilter };
            case 'untracked':
                return { base: baseFilterState, analysis: untrackedFilter };
        }
    }

    // data for the 'untracked' analysis mode - loaded here already so it's available when the mode is selected
    const cladeLineageQueryResult = useQuery({
        enabled: config.enabledAnalysisModes.includes('untracked'),
        queryKey: ['cladeLineages'],
        queryFn: () =>
            getCladeLineages(
                config.clinicalLapis.lapisBaseUrl,
                config.clinicalLapis.cladeField,
                config.clinicalLapis.lineageField,
                true,
            ),
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
                {config.enabledAnalysisModes.map((mode) => (
                    <option key={mode} value={mode}>
                        {modeLabel(mode)}
                    </option>
                ))}
            </select>
            <Inset className='p-2'>
                {(() => {
                    switch (selectedAnalysisMode) {
                        case 'manual':
                            return <ManualAnalysisFilter pageState={manualFilter} setPageState={setManualFilter} />;
                        case 'variant':
                            return (
                                <VariantExplorerFilter
                                    pageState={variantFilter}
                                    setPageState={setVariantFilter}
                                    clinicalSequenceLapisBaseUrl={config.clinicalLapis.lapisBaseUrl}
                                    clinicalSequenceLapisLineageField={config.clinicalLapis.lineageField}
                                />
                            );
                        case 'resistance':
                            return (
                                <ResistanceMutationsFilter
                                    pageState={resistanceFilter}
                                    setPageState={setResistanceFilter}
                                    resistanceMutationSets={config.resistanceMutationSets}
                                />
                            );
                        case 'untracked':
                            return (
                                <UntrackedFilter
                                    pageState={untrackedFilter}
                                    setPageState={setUntrackedFilter}
                                    clinicalSequenceLapisBaseUrl={config.clinicalLapis.lapisBaseUrl}
                                    clinicalSequenceLapisLineageField={config.clinicalLapis.lineageField}
                                    cladeLineageQueryResult={cladeLineageQueryResult}
                                />
                            );
                    }
                })()}
            </Inset>
            <ApplyFilterButton pageStateHandler={pageStateHandler} newPageState={getMergedPageState()} />
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
    }
}
