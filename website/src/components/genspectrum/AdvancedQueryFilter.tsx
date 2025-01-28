import type { ChangeEventHandler } from 'react';

export function AdvancedQueryFilter({
    value,
    onInput,
}: {
    value?: string;
    onInput?: ChangeEventHandler<HTMLInputElement>;
}) {
    return (
        <input
            className='input input-bordered w-full'
            placeholder={'Advanced query: A123T & ins_123:TA'}
            value={value}
            onInput={onInput}
        ></input>
    );
}
