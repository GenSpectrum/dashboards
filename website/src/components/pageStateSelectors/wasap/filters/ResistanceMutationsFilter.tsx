import { wastewaterConfig } from '../../../../types/wastewaterConfig';
import { type WasapResistanceFilter } from '../../../../views/pageStateHandlers/WasapPageStateHandler';
import { LabeledField } from '../utils/LabeledField';

export function ResistanceMutationsFilter({
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
                onChange={(e) => setPageState({ ...pageState, resistanceSet: e.target.value })}
            >
                {wastewaterConfig.wasap.resistanceMutations.map((resistanceMutation) => (
                    <option key={resistanceMutation.name} value={resistanceMutation.name}>
                        {resistanceMutation.name}
                    </option>
                ))}
            </select>
        </LabeledField>
    );
}
