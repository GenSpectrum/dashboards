import { type ChangeEvent, type FC, useEffect, useState } from 'react';

export const advancedQueryUrlParamForVariant = 'advancedQueryVariant';
export const advancedQueryUrlParam = 'advancedQuery';

type AdvancedQueryFilterProps = {
    value?: string;
    onInput?: (newValue: string | undefined) => void;
};

export const AdvancedQueryFilter: FC<AdvancedQueryFilterProps> = ({ value, onInput }) => {
    const [inputValue, setInputValue] = useState(value);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    if (import.meta.env.PUBLIC_DASHBOARDS_ENVIRONMENT !== 'dashboards-staging') {
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
                onInput={(event: ChangeEvent<HTMLInputElement>) => {
                    const newValue = event.target.value;
                    setInputValue(newValue === '' ? undefined : newValue);
                }}
                onBlur={() => {
                    onInput?.(inputValue);
                }}
            ></input>
        </label>
    );
};
