import type { ReactNode } from 'react';

import { LabeledField } from './LabeledField';

/**
 * An input for numeric values, consisting of a slider and a text field.
 */
export function NumericInput({
    label,
    info,
    value,
    min,
    max,
    step,
    onChange,
}: {
    label: string;
    info?: ReactNode;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (v: number) => void;
}) {
    return (
        <LabeledField label={label} info={info}>
            <div className='mb-2 w-full'>
                <input
                    className='input input-bordered mb-2 w-full'
                    type='number'
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => {
                        const parsedNumber = Number(e.target.value);
                        if (Number.isFinite(parsedNumber)) {
                            onChange(parsedNumber);
                        }
                    }}
                />
                <input
                    className='accent-primary w-full'
                    type='range'
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                />
            </div>
        </LabeledField>
    );
}
