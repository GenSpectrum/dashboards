import type { ChangeEventHandler } from 'react';

export function VariantQueryFilter({
    value,
    onInput,
}: {
    value?: string;
    onInput?: ChangeEventHandler<HTMLInputElement>;
}) {
    return (
        <label className='form-control'>
            <div className='label'>
                <span className='label-text'>Variant query</span>
            </div>
            <input
                className='input input-bordered w-full'
                placeholder={'Variant query: A123T & ins_123:TA'}
                value={value}
                onInput={onInput}
            ></input>
        </label>
    );
}
