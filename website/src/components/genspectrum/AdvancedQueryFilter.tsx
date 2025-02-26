import type { ChangeEventHandler } from 'react';

export function AdvancedQueryFilter({
    value,
    onInput,
}: {
    value?: string;
    onInput?: ChangeEventHandler<HTMLInputElement>;
}) {
    return (
        <label className='form-control'>
            <div className='label'>
                <span className='label-text'>Advanced query</span>
            </div>
            <input
                className='input input-bordered w-full'
                placeholder={'Advanced query: A123T & ins_123:TA'}
                value={value}
                onInput={onInput}
            ></input>
        </label>
    );
}
