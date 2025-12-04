import { mutationType, type MutationType } from '@genspectrum/dashboard-components/util';

import { GsMutationFilter } from '../../../genspectrum/GsMutationFilter';
import type { WasapManualFilter } from '../../../views/wasap/wasapPageConfig';
import { SequenceTypeSelector } from '../utils/SequenceTypeSelector';

export function ManualAnalysisFilter({
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
