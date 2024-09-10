import type { EvaluationInterval } from '../../../types/Subscription.ts';
import { InputLabel } from '../../../styles/input/InputLabel.tsx';

export function IntervalInput({ onIntervalChange }: { onIntervalChange: (value: EvaluationInterval) => void }) {
    return (
        <InputLabel title='Interval' description='How often you want to receive notifications.'>
            <select
                className='select select-bordered select-sm w-full max-w-xl'
                onInput={(interval) => onIntervalChange(interval.currentTarget.value as EvaluationInterval)}
            >
                <option value='daily'>daily</option>
                <option value='weekly'>weekly</option>
                <option value='monthly'>monthly</option>
            </select>
        </InputLabel>
    );
}
