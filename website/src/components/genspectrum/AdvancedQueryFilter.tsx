import { type InputEvent, type FC, useEffect, useState } from 'react';

type AdvancedQueryFilterProps = {
    value?: string;
    onInput?: (newValue: string | undefined) => void;
    enabled: boolean;
};

export const AdvancedQueryFilter: FC<AdvancedQueryFilterProps> = ({ value, onInput, enabled }) => {
    const [inputValue, setInputValue] = useState(value);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    if (!enabled) {
        return null;
    }

    return (
        <label className='form-control'>
            <div className='label'>
                <span className='label-text'>Advanced query</span>
            </div>
            <input
                className='input input-bordered w-full'
                placeholder={'Advanced query: A123T & ins_123:TA'}
                value={inputValue}
                onInput={(event: InputEvent<HTMLInputElement>) => {
                    const newValue = event.currentTarget.value;
                    setInputValue(newValue === '' ? undefined : newValue);
                }}
                onBlur={() => {
                    onInput?.(inputValue);
                }}
            ></input>
        </label>
    );
};
