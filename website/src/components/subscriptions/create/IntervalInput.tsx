import { InputLabel } from '../../../styles/input/InputLabel.tsx';
import {
    allEvaluationIntervals,
    EvaluationInterval,
    evaluationIntervalConfig,
} from '../../../types/EvaluationInterval.ts';

export function IntervalInput({ onIntervalChange }: { onIntervalChange: (value: EvaluationInterval) => void }) {
    return (
        <InputLabel title='Interval' description='How often you want to receive notifications.'>
            <select
                className='select select-bordered select-sm w-full max-w-xl'
                onInput={(interval) => onIntervalChange(interval.currentTarget.value as EvaluationInterval)}
            >
                {allEvaluationIntervals.map((interval) => (
                    <option key={interval} value={interval}>
                        {evaluationIntervalConfig[interval].label}
                    </option>
                ))}
            </select>
        </InputLabel>
    );
}
