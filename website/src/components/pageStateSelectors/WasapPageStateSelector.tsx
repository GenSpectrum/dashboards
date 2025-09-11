import { type SequenceType, type DateRangeOption } from '@genspectrum/dashboard-components/util';
import React, { useId, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton';
import { SelectorHeadline } from './SelectorHeadline';
import { Inset } from '../../styles/Inset';
import { wastewaterConfig } from '../../types/wastewaterConfig';
import { type PageStateHandler } from '../../views/pageStateHandlers/PageStateHandler';
import {
    type WasapFilter,
    wasapDateRangeOptions,
    type WasapAnalysisMode,
} from '../../views/pageStateHandlers/WasapPageStateHandler';
import { GsDateRangeFilter } from '../genspectrum/GsDateRangeFilter';
import { GsLineageFilter } from '../genspectrum/GsLineageFilter';
import { GsMutationFilter } from '../genspectrum/GsMutationFilter';
import { GsTextFilter } from '../genspectrum/GsTextFilter';
import { resistanceSetNames, type ResistanceSetName } from '../views/wasap/resistanceMutations';

export function WasapPageStateSelector({
    pageStateHandler,
    initialPageState,
}: {
    pageStateHandler: PageStateHandler<WasapFilter>;
    initialPageState: WasapFilter;
}) {
    const [pageState, setPageState] = useState(initialPageState);

    return (
        <div className='flex flex-col gap-4'>
            <SelectorHeadline>Filter dataset</SelectorHeadline>
            <Inset className='p-2'>
                <LabeledField label='Sampling location'>
                    <GsTextFilter
                        placeholderText='Sampling location'
                        lapisField='location_name'
                        lapisFilter={{}}
                        onInputChange={({ location_name: locationName }) => {
                            setPageState({ ...pageState, locationName });
                        }}
                        value={pageState.locationName}
                    />
                </LabeledField>
                <LabeledField label='Sampling date'>
                    <GsDateRangeFilter
                        lapisDateField='sampling_date'
                        onDateRangeChange={(dateRange: DateRangeOption | null) => {
                            setPageState({ ...pageState, samplingDate: dateRange ?? undefined });
                        }}
                        value={pageState.samplingDate}
                        dateRangeOptions={wasapDateRangeOptions()}
                    />
                </LabeledField>
                <GranularityFilter pageState={pageState} setPageState={setPageState} />
                <div className='text-sm'>
                    <input
                        type='checkbox'
                        id='excludeEmpty'
                        checked={pageState.excludeEmpty}
                        onChange={(e) => setPageState({ ...pageState, excludeEmpty: e.target.checked })}
                    />
                    <label htmlFor='excludeEmpty' className='pl-2'>
                        Exclude empty date ranges
                    </label>
                </div>
            </Inset>
            <SelectorHeadline>Mutation selection</SelectorHeadline>

            <select
                className='select select-bordered'
                value={pageState.analysisMode}
                onChange={(e) => {
                    const analysisMode = e.target.value as WasapAnalysisMode;
                    const sequenceType = analysisMode === 'resistance' ? 'amino acid' : pageState.sequenceType;
                    setPageState({
                        ...pageState,
                        analysisMode,
                        sequenceType,
                    });
                }}
            >
                <option value='manual'>Manual</option>
                <option value='variant'>Variant Explorer</option>
                <option value='resistance'>Resistance Mutations</option>
                <option value='untracked'>Untracked Mutations</option>
            </select>
            <Inset className='p-2'>
                {(() => {
                    switch (pageState.analysisMode) {
                        case 'manual':
                            return <ManualAnalysisFilter pageState={pageState} setPageState={setPageState} />;
                        case 'variant':
                            return <VariantExplorerFilter pageState={pageState} setPageState={setPageState} />;
                        case 'resistance':
                            return <ResistanceMutationsFilter pageState={pageState} setPageState={setPageState} />;
                        case 'untracked':
                            return <UntrackedFilter pageState={pageState} setPageState={setPageState} />;
                    }
                })()}
            </Inset>
            <ApplyFilterButton pageStateHandler={pageStateHandler} newPageState={pageState} />
        </div>
    );
}

function GranularityFilter({
    pageState,
    setPageState,
}: {
    pageState: WasapFilter;
    setPageState: (newState: WasapFilter) => void;
}) {
    const id = useId();

    return (
        <>
            <div className='h-2' />
            <LabeledField label='Granularity'>
                <div className='mb-2 flex gap-2 text-sm'>
                    <input
                        type='radio'
                        id={`${id}-day`}
                        name={`${id}-interval`}
                        value='day'
                        className='peer/day hidden'
                        checked={pageState.granularity === 'day'}
                        onChange={() => setPageState({ ...pageState, granularity: 'day' })}
                    />
                    <label
                        htmlFor={`${id}-day`}
                        className='peer-checked/day:border-primary flex-1 cursor-pointer rounded-md border border-gray-300 p-2 text-center'
                    >
                        Day
                    </label>

                    <input
                        type='radio'
                        id={`${id}-week`}
                        name={`${id}-interval`}
                        value='week'
                        className='peer/week hidden'
                        checked={pageState.granularity === 'week'}
                        onChange={() => setPageState({ ...pageState, granularity: 'week' })}
                    />
                    <label
                        htmlFor={`${id}-week`}
                        className='peer-checked/week:border-primary flex-1 cursor-pointer rounded-md border border-gray-300 p-2 text-center'
                    >
                        Week
                    </label>
                </div>
            </LabeledField>
        </>
    );
}

function ManualAnalysisFilter({
    pageState,
    setPageState,
}: {
    pageState: WasapFilter;
    setPageState: (newState: WasapFilter) => void;
}) {
    return (
        <>
            <SequenceTypeSelector
                value={pageState.sequenceType}
                onChange={(sequenceType) => {
                    if (sequenceType === pageState.sequenceType) return;
                    setPageState({ ...pageState, sequenceType, mutations: undefined });
                }}
            />
            <GsMutationFilter
                initialValue={pageState.mutations}
                onMutationChange={(mutationFilter) => {
                    if (pageState.sequenceType === 'nucleotide') {
                        setPageState({ ...pageState, mutations: mutationFilter?.nucleotideMutations });
                    } else {
                        setPageState({ ...pageState, mutations: mutationFilter?.aminoAcidMutations });
                    }
                }}
            />
        </>
    );
}

function VariantExplorerFilter({
    pageState,
    setPageState,
}: {
    pageState: WasapFilter;
    setPageState: (newState: WasapFilter) => void;
}) {
    return (
        <>
            <LabeledField label='Variant'>
                <gs-app lapis={wastewaterConfig.covSpectrumLapisBaseUrl}>
                    <GsLineageFilter
                        lapisField='pangoLineage'
                        lapisFilter={{}}
                        placeholderText='Variant'
                        value={pageState.variant}
                        onLineageChange={({ pangoLineage }) => {
                            setPageState({ ...pageState, variant: pangoLineage });
                        }}
                        hideCounts={true}
                    />
                </gs-app>
            </LabeledField>
            <SequenceTypeSelector
                value={pageState.sequenceType}
                onChange={(sequenceType) => setPageState({ ...pageState, sequenceType })}
            />
            <LabeledField label='Min. proportion'>
                <div className='mb-2 w-full'>
                    <input
                        className='w-full'
                        type='range'
                        min='0'
                        max='1'
                        step='0.01'
                        value={pageState.minProportion}
                        onChange={(e) => {
                            setPageState({ ...pageState, minProportion: parseFloat(e.target.value) });
                        }}
                    />
                </div>
            </LabeledField>
            <LabeledField label='Min. count'>
                <div className='mb-2 w-full'>
                    <input
                        className='w-full'
                        type='range'
                        min='1'
                        max='250'
                        step='1'
                        value={pageState.minCount}
                        onChange={(e) => {
                            setPageState({ ...pageState, minCount: parseInt(e.target.value) });
                        }}
                    />
                </div>
            </LabeledField>
        </>
    );
}

function ResistanceMutationsFilter({
    pageState,
    setPageState,
}: {
    pageState: WasapFilter;
    setPageState: (newState: WasapFilter) => void;
}) {
    return (
        <LabeledField label='Resistance mutation set'>
            <select
                className='select select-bordered'
                value={pageState.resistanceSet}
                onChange={(e) => setPageState({ ...pageState, resistanceSet: e.target.value as ResistanceSetName })}
            >
                <option value={resistanceSetNames.ThreeCLPro}>{resistanceSetNames.ThreeCLPro}</option>
                <option value={resistanceSetNames.RdRp}>{resistanceSetNames.RdRp}</option>
                <option value={resistanceSetNames.Spike}>{resistanceSetNames.Spike}</option>
            </select>
        </LabeledField>
    );
}

function UntrackedFilter({
    pageState,
    setPageState,
}: {
    pageState: WasapFilter;
    setPageState: (newState: WasapFilter) => void;
}) {
    return (
        <LabeledField label='Known variants to exclude'>
            <input
                className='input input-bordered'
                value={pageState.excludeVariants?.join(' ')}
                onChange={(e) => setPageState({ ...pageState, excludeVariants: e.target.value.split(' ') })}
            />
        </LabeledField>
    );
}

// Shared UI helpers

function SequenceTypeSelector({ value, onChange }: { value: SequenceType; onChange: (newType: SequenceType) => void }) {
    return (
        <LabeledField label='Sequence type'>
            <select
                className='select select-bordered mb-2'
                value={value}
                onChange={(e) => onChange(e.target.value as SequenceType)}
            >
                <option value='nucleotide'>Nucleotide</option>
                <option value='amino acid'>Amino acid</option>
            </select>
        </LabeledField>
    );
}

function LabeledField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className='form-control'>
            <div className='label'>
                <span className='label-text'>{label}</span>
            </div>
            {children}
        </label>
    );
}
