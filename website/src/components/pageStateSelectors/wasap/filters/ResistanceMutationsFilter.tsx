import { type WasapResistanceFilter } from '../../../../views/pageStateHandlers/WasapPageStateHandler';
import type { ResistanceMutationSet } from '../../../views/wasap/resistanceMutations';
import { LabeledField } from '../utils/LabeledField';

export function ResistanceMutationsFilter({
    pageState,
    setPageState,
    resistanceMutationSets,
}: {
    pageState: WasapResistanceFilter;
    setPageState: (newState: WasapResistanceFilter) => void;
    resistanceMutationSets: ResistanceMutationSet[];
}) {
    return (
        <LabeledField label='Resistance mutation set'>
            <select
                className='select select-bordered'
                value={pageState.resistanceSet}
                onChange={(e) => setPageState({ ...pageState, resistanceSet: e.target.value })}
            >
                {resistanceMutationSets.map((set) => (
                    <option key={set.name} value={set.name}>
                        {set.name}
                    </option>
                ))}
            </select>
        </LabeledField>
    );
}
