import { Inset } from '../../../../styles/Inset';
import { GsLineageFilter } from '../../../genspectrum/GsLineageFilter';
import {
    VARIANT_TIME_FRAME,
    variantTimeFrameLabel,
    type VariantTimeFrame,
    type WasapVariantFilter,
} from '../../../views/wasap/wasapPageConfig';
import { SelectorHeadline } from '../../SelectorHeadline';
import { DefineClinicalSignatureInfo } from '../InfoBlocks';
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
}

export function VariantExplorerFilter({
    pageState,
    setPageState,
    clinicalSequenceLapisBaseUrl,
    clinicalSequenceLapisLineageField,
}: VariantExplorerFilterProps) {
    return (
        <>
            <SequenceTypeSelector
                value={pageState.sequenceType}
                onChange={(sequenceType) => setPageState({ ...pageState, sequenceType })}
            />
            <Inset className='mt-4 p-2'>
                <SelectorHeadline info={<DefineClinicalSignatureInfo />}>Define Clinical Signature</SelectorHeadline>
                <LabeledField label='Variant'>
                    <gs-app lapis={clinicalSequenceLapisBaseUrl}>
                        <GsLineageFilter
                            lapisField={clinicalSequenceLapisLineageField}
                            lapisFilter={{}}
                            placeholderText='Variant'
                            value={pageState.variant}
                            onLineageChange={(lineages) => {
                                setPageState({ ...pageState, variant: lineages[clinicalSequenceLapisLineageField] });
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
                        onChange={(e) => setPageState({ ...pageState, timeFrame: e.target.value as VariantTimeFrame })}
                    >
                        <option value={VARIANT_TIME_FRAME.all}>{variantTimeFrameLabel(VARIANT_TIME_FRAME.all)}</option>
                        <option value={VARIANT_TIME_FRAME.sixMonths}>
                            Past {variantTimeFrameLabel(VARIANT_TIME_FRAME.sixMonths)}
                        </option>
                        <option value={VARIANT_TIME_FRAME.threeMonths}>
                            Past {variantTimeFrameLabel(VARIANT_TIME_FRAME.threeMonths)}
                        </option>
                    </select>
                </LabeledField>
            </Inset>
        </>
    );
}
