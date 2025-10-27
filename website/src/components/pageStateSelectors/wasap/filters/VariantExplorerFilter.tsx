import { type WasapVariantFilter } from '../../../../views/pageStateHandlers/WasapPageStateHandler';
import { GsLineageFilter } from '../../../genspectrum/GsLineageFilter';
import { JaccardIndexInfo, MinCountInfo, MinProportionInfo } from '../InfoBlocks';
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
}

export function VariantExplorerFilter({
    pageState,
    setPageState,
    clinicalSequenceLapisBaseUrl,
}: VariantExplorerFilterProps) {
    return (
        <>
            <SequenceTypeSelector
                value={pageState.sequenceType}
                onChange={(sequenceType) => setPageState({ ...pageState, sequenceType })}
            />
            <LabeledField label='Variant'>
                <gs-app lapis={clinicalSequenceLapisBaseUrl}>
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
            <NumericInput
                label='Min. proportion'
                value={pageState.minProportion}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => setPageState({ ...pageState, minProportion: v })}
                info={<MinProportionInfo />}
            />
            <NumericInput
                label='Min. count'
                value={pageState.minCount}
                min={1}
                max={250}
                step={1}
                onChange={(v) => setPageState({ ...pageState, minCount: Math.round(v) })}
                info={<MinCountInfo />}
            />
            <NumericInput
                label='Min. Jaccard index'
                info={<JaccardIndexInfo />}
                value={pageState.minJaccard}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => setPageState({ ...pageState, minJaccard: v })}
            />
        </>
    );
}
