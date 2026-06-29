import { type UseQueryResult } from '@tanstack/react-query';
import { useId } from 'react';

import { Inset } from '../../../../styles/Inset';
import { type CollectionSummary } from '../../../../types/Collection';
import { GsLineageFilter } from '../../../genspectrum/GsLineageFilter';
import {
    VARIANT_TIME_FRAME,
    variantTimeFrameLabel,
    type SignatureType,
    type VariantTimeFrame,
    type WasapVariantFilter,
} from '../../../views/wasap/wasapPageConfig';
import { SelectorHeadline } from '../../SelectorHeadline';
import { DefineClinicalSignatureInfo } from '../InfoBlocks';
import { CollectionCombobox } from '../utils/CollectionCombobox';
import { LabeledField } from '../utils/LabeledField';
import { NumericInput } from '../utils/NumericInput';
import { SequenceTypeSelector } from '../utils/SequenceTypeSelector';

interface VariantExplorerFilterProps {
    pageState: WasapVariantFilter;
    setPageState: (newState: WasapVariantFilter) => void;
    /**
     * The LAPIS base URL for the clinical sequence data used in the variant selector.
     * This is _not_ the same as the LAPIS providing the wastewater amplicon sequences.
     */
    clinicalSequenceLapisBaseUrl: string;
    clinicalSequenceLapisLineageField: string;
    predefinedVariantsQueryResult?: UseQueryResult<CollectionSummary[]>;
    predefinedVariantsLabel?: string;
}

export function VariantExplorerFilter({
    pageState,
    setPageState,
    clinicalSequenceLapisBaseUrl,
    clinicalSequenceLapisLineageField,
    predefinedVariantsQueryResult,
    predefinedVariantsLabel = 'Predefined',
}: VariantExplorerFilterProps) {
    const handleSignatureTypeChange = (newType: SignatureType) => {
        setPageState({ ...pageState, signatureType: newType });
    };

    return (
        <>
            <SequenceTypeSelector
                value={pageState.sequenceType}
                onChange={(sequenceType) => setPageState({ ...pageState, sequenceType })}
            />
            {predefinedVariantsQueryResult !== undefined && (
                <LabeledField label='Variant definition source'>
                    <select
                        className='select select-bordered'
                        value={pageState.signatureType}
                        onChange={(e) => handleSignatureTypeChange(e.target.value as SignatureType)}
                    >
                        <option value='computed'>Extracted from clinical sequences</option>
                        <option value='predefined'>{predefinedVariantsLabel}</option>
                    </select>
                </LabeledField>
            )}
            {pageState.signatureType === 'predefined' && (
                <PredefinedSignature
                    pageState={pageState}
                    setPageState={setPageState}
                    predefinedVariantsQueryResult={predefinedVariantsQueryResult}
                />
            )}
            {pageState.signatureType === 'computed' && (
                <Inset className='mt-4 p-2'>
                    <SelectorHeadline info={<DefineClinicalSignatureInfo />}>
                        Define Clinical Signature
                    </SelectorHeadline>
                    <LabeledField label='Variant'>
                        <gs-app lapis={clinicalSequenceLapisBaseUrl}>
                            <GsLineageFilter
                                lapisField={clinicalSequenceLapisLineageField}
                                lapisFilter={{}}
                                placeholderText='Variant'
                                value={pageState.variant}
                                onLineageChange={(lineages) => {
                                    setPageState({
                                        ...pageState,
                                        variant: lineages[clinicalSequenceLapisLineageField],
                                    });
                                }}
                                hideCounts={true}
                            />
                        </gs-app>
                    </LabeledField>
                    <NumericInput
                        label='Min. proportion'
                        value={pageState.minProportion}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={(v) => setPageState({ ...pageState, minProportion: v })}
                    />
                    <NumericInput
                        label='Min. count'
                        value={pageState.minCount}
                        min={1}
                        max={250}
                        step={1}
                        onChange={(v) => setPageState({ ...pageState, minCount: Math.round(v) })}
                    />
                    <NumericInput
                        label='Min. Jaccard index'
                        value={pageState.minJaccard}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={(v) => setPageState({ ...pageState, minJaccard: v })}
                    />
                    <LabeledField label='Time frame'>
                        <select
                            className='select select-bordered'
                            value={pageState.timeFrame}
                            onChange={(e) =>
                                setPageState({ ...pageState, timeFrame: e.target.value as VariantTimeFrame })
                            }
                        >
                            <option value={VARIANT_TIME_FRAME.all}>
                                {variantTimeFrameLabel(VARIANT_TIME_FRAME.all)}
                            </option>
                            <option value={VARIANT_TIME_FRAME.sixMonths}>
                                Past {variantTimeFrameLabel(VARIANT_TIME_FRAME.sixMonths)}
                            </option>
                            <option value={VARIANT_TIME_FRAME.threeMonths}>
                                Past {variantTimeFrameLabel(VARIANT_TIME_FRAME.threeMonths)}
                            </option>
                        </select>
                    </LabeledField>
                </Inset>
            )}
        </>
    );
}

function PredefinedSignature({
    pageState,
    setPageState,
    predefinedVariantsQueryResult,
}: {
    pageState: WasapVariantFilter;
    setPageState: (newState: WasapVariantFilter) => void;
    predefinedVariantsQueryResult: UseQueryResult<CollectionSummary[]> | undefined;
}) {
    const collections = predefinedVariantsQueryResult?.data ?? [];
    const selectedCollection = collections.find((c) => c.id === pageState.collectionId) ?? null;
    const newMutationsCheckBoxId = useId();
    const includeSublineagesCheckBoxId = useId();

    return (
        <Inset className='mt-4 p-2'>
            <LabeledField label='Variant'>
                <CollectionCombobox
                    collections={collections}
                    value={selectedCollection}
                    onChange={(c) => setPageState({ ...pageState, collectionId: c?.id })}
                />
            </LabeledField>
            <div className='pt-2 text-sm'>
                <input
                    className='accent-primary'
                    type='checkbox'
                    id={newMutationsCheckBoxId}
                    checked={pageState.newMutationsOnly ?? false}
                    onChange={(e) => setPageState({ ...pageState, newMutationsOnly: e.target.checked })}
                />
                <div
                    className='tooltip tooltip-right inline'
                    data-tip='Only show mutations that were not observed in the parent variant'
                >
                    <label htmlFor={newMutationsCheckBoxId} className='cursor-pointer pl-2'>
                        Mutation not in parent
                    </label>
                </div>
            </div>
            <div className='mt-4'>
                <NumericInput
                    label='Min. Jaccard index'
                    value={pageState.minJaccard}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(v) => setPageState({ ...pageState, minJaccard: v })}
                />
            </div>
            <div className='text-sm'>
                <input
                    className='accent-primary'
                    type='checkbox'
                    id={includeSublineagesCheckBoxId}
                    checked={pageState.includeSublineagesForJaccard !== false}
                    onChange={(e) => setPageState({ ...pageState, includeSublineagesForJaccard: e.target.checked })}
                />
                <div
                    className='tooltip tooltip-right inline'
                    data-tip='Include sublineages when computing Jaccard index (appends * to the lineage)'
                >
                    <label htmlFor={includeSublineagesCheckBoxId} className='cursor-pointer pl-2'>
                        Include sublineages for Jaccard computation
                    </label>
                </div>
            </div>
        </Inset>
    );
}
