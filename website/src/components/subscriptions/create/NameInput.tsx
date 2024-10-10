import { InputLabel } from '../../../styles/input/InputLabel.tsx';

export function NameInput({ onNameChange }: { onNameChange: (value: string) => void }) {
    return (
        <InputLabel
            title='Name'
            description='A name for the subscription. This will be used to identify the subscription in the list of subscriptions.'
        >
            <input
                className='input input-sm input-bordered w-full max-w-xl'
                placeholder='Your name for the subscription'
                onChange={(name) => onNameChange(name.currentTarget.value)}
            />
        </InputLabel>
    );
}
