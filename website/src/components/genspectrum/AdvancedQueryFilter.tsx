import { useMutation } from '@tanstack/react-query';
import { type FC, type InputEvent, useEffect, useRef, useState } from 'react';

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

    const { mutate: validateQuery } = useMutation({
        mutationFn: (query: string) => parseQuery(lapisUrl, { queries: [query] }),
        onSuccess: (results, query) => {
            const result = results[0];
            if (result.type === 'success') {
                setValidationState({ type: 'valid' });
                onInput?.(query);
            } else {
                setValidationState({ type: 'error', message: result.error });
            }
        },
        onError: () => {
            logger.error(`Failed to validate advanced query`);
            setValidationState({ type: 'error', message: 'Validation is not possible right now.' });
        },
    });

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

        const timeout = setTimeout(() => validateQuery(inputValue), DEBOUNCE_MS);

        return () => clearTimeout(timeout);
    }, [inputValue, lapisUrl, onInput, validateQuery]);

    if (!enabled) {
        return null;
    }

    const isError = validationState.type === 'error';
    const isValid = validationState.type === 'valid';
    const isValidating = validationState.type === 'validating';

    return (
        <div className='form-control'>
            <div className='label'>
                <span className='label-text'>Advanced query</span>
            </div>
            <label
                className={`input input-bordered isolation-auto flex w-full items-center gap-2 ${isError ? 'input-error' : ''}`}
            >
                <input
                    className='grow'
                    placeholder={'Advanced query: A123T & ins_123:TA'}
                    value={inputValue ?? ''}
                    onInput={(event: InputEvent<HTMLInputElement>) => {
                        userEditedRef.current = true;
                        const newValue = event.currentTarget.value;
                        setInputValue(newValue === '' ? undefined : newValue);
                    }}
                />
                {isValidating && <span className='loading loading-spinner loading-xs' title='Validating' />}
                {isValid && <div className='iconify mdi--check text-success size-4' title='Advanced query is valid' />}
                {isError && <ErrorIconWithTooltip message={validationState.message} />}
            </label>
        </div>
    );
};

const ErrorIconWithTooltip: FC<{ message: string }> = ({ message }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`tooltip tooltip-left lg:tooltip-right z-1000 ${isOpen ? 'tooltip-open' : ''}`}>
            <div className='tooltip-content z-1000'>
                <div className='flex items-start gap-1'>
                    <span>{message}</span>
                    {isOpen && (
                        <button
                            className='iconify mdi--close pointer-events-auto shrink-0 cursor-pointer text-xs'
                            aria-label='Close tooltip'
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                        />
                    )}
                </div>
            </div>
            <button
                className='iconify mdi--alert-circle text-error size-4 cursor-pointer'
                onClick={() => setIsOpen((open) => !open)}
                aria-label='Error'
            />
        </div>
    );
};
