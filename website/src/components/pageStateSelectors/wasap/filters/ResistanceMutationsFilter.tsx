import { type WasapResistanceFilter } from '../../../../views/pageStateHandlers/WasapPageStateHandler';
import { resistanceSetNames, type ResistanceSetName } from '../../../views/wasap/resistanceMutations';
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
                onChange={(e) => setPageState({ ...pageState, resistanceSet: e.target.value as ResistanceSetName })}
            >
                <option value={resistanceSetNames.ThreeCLPro}>{resistanceSetNames.ThreeCLPro}</option>
                <option value={resistanceSetNames.RdRp}>{resistanceSetNames.RdRp}</option>
                <option value={resistanceSetNames.Spike}>{resistanceSetNames.Spike}</option>
            </select>
        </LabeledField>
    );
}
