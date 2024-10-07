import { InputLabel } from '../../../styles/input/InputLabel.tsx';
import { type Organism, organismConfig } from '../../../types/Organism.ts';

export function OrganismInput({ onOrganismChange }: { onOrganismChange: (value: Organism) => void }) {
    return (
        <InputLabel title='Organism' description='The organism you want to receive notifications for.'>
            <select
                className='select select-bordered select-sm w-full max-w-xl'
                onChange={(pathogen) => onOrganismChange(pathogen.currentTarget.value as Organism)}
            >
                {/*TODO: #167 Allow users to create subscriptions for other organisms */}
                {['covid' as const].map((organism) => (
                    <option key={organism} value={organism}>
                        {organismConfig[organism].label}
                    </option>
                ))}
            </select>
        </InputLabel>
    );
}
