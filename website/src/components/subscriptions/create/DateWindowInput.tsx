import { InputLabel } from '../../../styles/input/InputLabel.tsx';
import { allDateWindows, type DateWindow, dateWindowConfig } from '../../../types/DateWindow.ts';

export function DateWindowInput({ onDateWindowChange }: { onDateWindowChange: (value: DateWindow) => void }) {
    return (
        <InputLabel
            title={'Date window'}
            description={'The threshold condition will be calculated over this time window.'}
        >
            <select
                className='select select-bordered select-sm w-full max-w-xl'
                onInput={(event) => {
                    const newValue = event.currentTarget.value as DateWindow;
                    onDateWindowChange(newValue);
                }}
            >
                {allDateWindows.map((dateWindow) => (
                    <option key={dateWindow} value={dateWindow}>
                        {dateWindowConfig[dateWindow].label}
                    </option>
                ))}
            </select>
        </InputLabel>
    );
}
