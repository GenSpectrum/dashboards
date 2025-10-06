import { type SequenceType, mutationType, type MutationType } from '@genspectrum/dashboard-components/util';
import React, { Fragment, useId, useState } from 'react';

import { ApplyFilterButton } from './ApplyFilterButton';
import { DynamicDateFilter } from './DynamicDateFilter';
import { SelectorHeadline } from './SelectorHeadline';
import { Inset } from '../../styles/Inset';
import { wastewaterConfig } from '../../types/wastewaterConfig';
import { type PageStateHandler } from '../../views/pageStateHandlers/PageStateHandler';
import {
    type WasapFilter,
    type WasapAnalysisMode,
    type WasapManualFilter,
    type WasapVariantFilter,
    type WasapResistanceFilter,
    type WasapUntrackedFilter,
    defaultManualFilter,
    defaultVariantFilter,
    defaultResistanceFilter,
    defaultUntrackedFilter,
    type WasapBaseFilter,
    type WasapAnalysisFilter,
    wasapDateRangeOptions,
} from '../../views/pageStateHandlers/WasapPageStateHandler';
import { GsLineageFilter } from '../genspectrum/GsLineageFilter';
import { GsMutationFilter } from '../genspectrum/GsMutationFilter';
import { GsTextFilter } from '../genspectrum/GsTextFilter';
import { resistanceSetNames, type ResistanceSetName } from '../views/wasap/resistanceMutations';

export function WasapPageStateSelector({
    pageStateHandler,
    initialBaseFilterState,
    initialAnalysisFilterState,
}: {
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
                            setBaseFilterState({ ...baseFilterState, locationName });
                        }}
                        value={baseFilterState.locationName}
                    />
                </LabeledField>

                <DynamicDateFilter
                    label='Sampling date'
                    lapis={wastewaterConfig.wasap.lapisBaseUrl}
                    dateFieldName={wastewaterConfig.wasap.samplingDateField}
                    baselineOptions={wasapDateRangeOptions()}
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
                <option value='manual'>Manual</option>
                <option value='variant'>Variant Explorer</option>
                <option value='resistance'>Resistance Mutations</option>
                <option value='untracked'>Untracked Mutations</option>
            </select>
            <Inset className='p-2'>
                {(() => {
                    switch (selectedAnalysisMode) {
                        case 'manual':
                            return <ManualAnalysisFilter pageState={manualFilter} setPageState={setManualFilter} />;
                        case 'variant':
                            return <VariantExplorerFilter pageState={variantFilter} setPageState={setVariantFilter} />;
                        case 'resistance':
                            return (
                                <ResistanceMutationsFilter
                                    pageState={resistanceFilter}
                                    setPageState={setResistanceFilter}
                                />
                            );
                        case 'untracked':
                            return <UntrackedFilter pageState={untrackedFilter} setPageState={setUntrackedFilter} />;
                    }
                })()}
            </Inset>
            <ApplyFilterButton pageStateHandler={pageStateHandler} newPageState={getMergedPageState()} />
        </div>
    );
}

function ManualAnalysisFilter({
    pageState,
    setPageState,
}: {
    pageState: WasapManualFilter;
    setPageState: (newState: WasapManualFilter) => void;
}) {
    const enabledMutationTypes: MutationType[] =
        pageState.sequenceType === 'nucleotide'
            ? [mutationType.nucleotideMutations]
            : [mutationType.aminoAcidMutations];
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
                enabledMutationTypes={enabledMutationTypes}
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
    pageState: WasapVariantFilter;
    setPageState: (newState: WasapVariantFilter) => void;
}) {
    return (
        <>
            <SequenceTypeSelector
                value={pageState.sequenceType}
                onChange={(sequenceType) => setPageState({ ...pageState, sequenceType })}
            />
            <LabeledField label='Variant'>
                <gs-app lapis={wastewaterConfig.wasap.covSpectrumLapisBaseUrl}>
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
    pageState: WasapResistanceFilter;
    setPageState: (newState: WasapResistanceFilter) => void;
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
    pageState: WasapUntrackedFilter;
    setPageState: (newState: WasapUntrackedFilter) => void;
}) {
    return (
        <>
            <SequenceTypeSelector
                value={pageState.sequenceType}
                onChange={(sequenceType) => setPageState({ ...pageState, sequenceType })}
            />
            <LabeledField label='Known variants to exclude'>
                <input
                    className='input input-bordered'
                    value={pageState.excludeVariants?.join(' ')}
                    onChange={(e) => setPageState({ ...pageState, excludeVariants: e.target.value.split(' ') })}
                />
            </LabeledField>
        </>
    );
}

function ExplorationModeInfo() {
    return (
        <div className='relative p-8'>
            <form method='dialog'>
                <button className='btn btn-sm btn-circle btn-ghost absolute top-2 right-2'>✕</button>
            </form>
            <h1 className='mb-2 text-xl font-semibold'>Exploration modes</h1>
            <p className='mb-4 text-gray-700'>
                These exploration views allow visualising the mutations found in the recent past by:
            </p>
            <ul className='mb-4 list-inside list-disc space-y-2 text-gray-700'>
                <li>
                    <span className='font-semibold text-gray-900'>Resistance Mutations:</span> lookup of mutations known
                    to confer resistance to antiviral drugs
                </li>
                <li>
                    <span className='font-semibold text-gray-900'>Untracked Mutations:</span> novel mutations not yet
                    attributed to major variants
                </li>
                <li>
                    <span className='font-semibold text-gray-900'>Manual:</span> explore freely, using the filters on
                    the plot, i.e., search by minimal proportion
                </li>
                <li>
                    <span className='font-semibold text-gray-900'>Variant Explorer:</span> track variant-specific
                    mutations over time
                </li>
            </ul>

            <p className='text-gray-700'>
                The visualized data consists of aligned sequencing reads from virus-specific next-generation sequencing,
                displayed in both nucleotide and amino acid formats.
            </p>
        </div>
    );
}

// Shared UI helpers

function SequenceTypeSelector({ value, onChange }: { value: SequenceType; onChange: (newType: SequenceType) => void }) {
    return (
        <RadioSelect
            label='Sequence type'
            value={value}
            options={[
                { value: 'nucleotide', label: 'Nucleotide' },
                { value: 'amino acid', label: 'Amino acid' },
            ]}
            onChange={onChange}
        />
    );
}

function RadioSelect<T extends string>({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: T;
    options: { value: T; label: string }[];
    onChange: (val: T) => void;
}) {
    const id = useId();

    return (
        <>
            <LabeledField label={label}>
                <div className='mb-2 flex gap-2 text-sm'>
                    {options.map((opt) => {
                        const isChecked = value === opt.value;
                        return (
                            <Fragment key={opt.value}>
                                <input
                                    type='radio'
                                    id={`${id}-${opt.value}`}
                                    name={id}
                                    value={opt.value}
                                    className='hidden'
                                    checked={isChecked}
                                    onChange={() => onChange(opt.value)}
                                />
                                <label
                                    htmlFor={`${id}-${opt.value}`}
                                    className={`flex-1 cursor-pointer rounded-md border p-2 text-center ${
                                        isChecked ? 'border-primary' : 'border-gray-300'
                                    }`}
                                >
                                    {opt.label}
                                </label>
                            </Fragment>
                        );
                    })}
                </div>
            </LabeledField>
        </>
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
