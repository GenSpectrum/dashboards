import { type InputEvent, type FC, useEffect, useRef, useState } from 'react';

import { getClientLogger } from '../../clientLogger.ts';
import { parseQuery } from '../../lapis/parseQuery.ts';

const logger = getClientLogger('AdvancedQueryFilter');

const DEBOUNCE_MS = 500;

type ValidationState =
    | { type: 'idle' }
    | { type: 'validating' }
    | { type: 'valid' }
    | { type: 'error'; message: string };

type AdvancedQueryFilterProps = {
    value?: string;
    onInput?: (newValue: string | undefined) => void;
    enabled: boolean;
    lapisUrl: string;
};

export const AdvancedQueryFilter: FC<AdvancedQueryFilterProps> = ({ value, onInput, enabled, lapisUrl }) => {
    const [inputValue, setInputValue] = useState(value);
    const [validationState, setValidationState] = useState<ValidationState>({ type: 'idle' });
    const userEditedRef = useRef(false);

    useEffect(() => {
        userEditedRef.current = false;
        setInputValue(value);
    }, [value]);

    useEffect(() => {
        if (!userEditedRef.current) {
            return;
        }

        if (inputValue === undefined || inputValue === '') {
            setValidationState({ type: 'idle' });
            onInput?.(undefined);
            return;
        }

        setValidationState({ type: 'validating' });

        const timeout = setTimeout(async () => {
            try {
                const results = await parseQuery(lapisUrl, [inputValue]);
                const result = results[0];
                if (result.type === 'success') {
                    setValidationState({ type: 'valid' });
                    onInput?.(inputValue);
                } else {
                    setValidationState({ type: 'error', message: result.error });
                }
            } catch {
                logger.error(`Failed to validate advanced query`);
                setValidationState({ type: 'error', message: 'Validation is not possible right now.' });
            }
        }, DEBOUNCE_MS);

        return () => clearTimeout(timeout);
    }, [inputValue, lapisUrl, onInput]);

    if (!enabled) {
        return null;
    }

    const isError = validationState.type === 'error';
    const isValid = validationState.type === 'valid';

    return (
        <div className='form-control'>
            <div className='label'>
                <span className='label-text'>Advanced query</span>
            </div>
            <input
                className={`input input-bordered w-full ${isError ? 'input-error' : ''} ${isValid ? 'input-success' : ''}`}
                placeholder={'Advanced query: A123T & ins_123:TA'}
                value={inputValue ?? ''}
                onInput={(event: InputEvent<HTMLInputElement>) => {
                    userEditedRef.current = true;
                    const newValue = event.currentTarget.value;
                    setInputValue(newValue === '' ? undefined : newValue);
                }}
            />
            {isError && (
                <div className='label'>
                    <span className='label-text-alt text-error'>{validationState.message}</span>
                </div>
            )}
        </div>
    );
};
