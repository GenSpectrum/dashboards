import type { WasapResistanceFilter } from '../../../views/wasap/wasapPageConfig';
import { LabeledField } from '../utils/LabeledField';

export function ResistanceMutationsFilter({
    pageState,
    setPageState,
    resistanceSetNames,
}: {
    pageState: WasapResistanceFilter;
    setPageState: (newState: WasapResistanceFilter) => void;
    resistanceSetNames: string[];
}) {
    return (
        <LabeledField label='Resistance mutation set'>
            <select
                className='select select-bordered'
                value={pageState.resistanceSet}
                onChange={(e) => setPageState({ ...pageState, resistanceSet: e.target.value })}
            >
                {resistanceSetNames.map((name) => (
                    <option key={name} value={name}>
                        {name}
                    </option>
                ))}
            </select>
        </LabeledField>
    );
}
