import type { ChangeEvent } from 'react';

export const advancedQueryUrlParamForVariant = 'advancedQueryVariant';
export const advancedQueryUrlParam = 'advancedQuery';

export function AdvancedQueryFilter({
    value,
    onInput,
}: {
    value?: string;
    onInput?: (newValue: string | undefined) => void;
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
                onInput={(event: ChangeEvent<HTMLInputElement>) => {
                    const newValue = event.target.value;
                    onInput?.(newValue === '' ? undefined : newValue);
                }}
            ></input>
        </label>
    );
}
