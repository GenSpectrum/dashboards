import { type SequenceType, type DateRangeOption } from '@genspectrum/dashboard-components/util';
import React, { useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton';
import { SelectorHeadline } from './SelectorHeadline';
import { Inset } from '../../styles/Inset';
import { type PageStateHandler } from '../../views/pageStateHandlers/PageStateHandler';
import {
    type WasapFilter,
    wasapDateRangeOptions,
    type WasapAnalysisMode,
} from '../../views/pageStateHandlers/WasapPageStateHandler';
import { GsDateRangeFilter } from '../genspectrum/GsDateRangeFilter';
import { GsMutationFilter } from '../genspectrum/GsMutationFilter';
import { GsTextFilter } from '../genspectrum/GsTextFilter';

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
            </Inset>
            <SelectorHeadline>Mutation selection</SelectorHeadline>

            <select
                className='select select-bordered'
                value={pageState.analysisMode}
                onChange={(e) =>
                    setPageState({
                        ...pageState,
                        analysisMode: e.target.value as WasapAnalysisMode,
                    })
                }
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
                            return <ResistanceMutationsFilter />;
                        case 'untracked':
                            return <UntrackedFilter />;
                    }
                })()}
            </Inset>
            <ApplyFilterButton pageStateHandler={pageStateHandler} newPageState={pageState} />
        </div>
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
                <input
                    className='input input-bordered mb-2'
                    placeholder='Variant'
                    value={pageState.variant ?? ""}
                    onChange={(e) => {
                        setPageState({...pageState, variant: e.target.value})
                    }}
                />
                {/**
                 * The variant can be a freeform text field, but we can also get the variants from
                 * GET /open/v2/sample/aggregated?fields=pangoLineage
                 */}
            </LabeledField>
            <SequenceTypeSelector
                value={pageState.sequenceType}
                onChange={(sequenceType) => setPageState({ ...pageState, sequenceType })}
            />
            {/* TODO - add a range control for the proportion */}
        </>
    );
}

function ResistanceMutationsFilter() {
    return (
        <LabeledField label='Resistance mutation set'>
            <select className='select select-bordered'>
                <option>Foo</option> {/* TODO */}
                <option>Bar</option>
            </select>
        </LabeledField>
    );
}

function UntrackedFilter() {
    return (
        <LabeledField label='Known variants to exclude'>
            <input className='input input-bordered' />
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
