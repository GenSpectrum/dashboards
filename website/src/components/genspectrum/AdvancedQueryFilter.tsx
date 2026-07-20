import { useMutation } from '@tanstack/react-query';
import { type FC, type InputEvent, useEffect, useRef, useState } from 'react';

import { getClientLogger } from '../../clientLogger.ts';
import { parseQuery } from '../../lapis/parseQuery.ts';
import { extractMetadataFields } from '../../lapis/siloFilterExpression.ts';

const logger = getClientLogger('AdvancedQueryFilter');

const DEBOUNCE_MS = 500;

type ValidationState =
    { type: 'idle' } | { type: 'validating' } | { type: 'valid' } | { type: 'error'; message: string };

type AdvancedQueryFilterProps = {
    value?: string;
    /**
     * Also reports validity of the new input.
     * Known limitation: Doesn't report anything on the initial mount.
     */
    onInput?: (newValue: string | undefined, isValid: boolean) => void;
    enabled: boolean;
    lapisUrl: string;
    /**
     * Tailwind classes controlling the direction of the validation error tooltip.
     * Defaults to `'tooltip-left lg:tooltip-right'`.
     *
     * Common values: `tooltip-left`, `tooltip-right`, `tooltip-top`, `tooltip-bottom`.
     * Responsive variants are also valid, e.g. `'tooltip-left lg:tooltip-right'`.
     */
    errorTooltipClass?: string;
    allowedFields?: string[];
    /**
     * When `true`, an empty query is treated as invalid (reported as invalid and shown as an error).
     * Defaults to `false`.
     */
    isRequired?: boolean;
};

const EMPTY_REQUIRED_MESSAGE = 'A query is required.';

export const AdvancedQueryFilter: FC<AdvancedQueryFilterProps> = ({
    value,
    onInput,
    enabled,
    lapisUrl,
    errorTooltipClass,
    allowedFields,
    isRequired = false,
}) => {
    const [inputValue, setInputValue] = useState(value);
    const [validationState, setValidationState] = useState<ValidationState>({ type: 'idle' });
    const userEditedRef = useRef(false);

    const { mutate: validateQuery } = useMutation({
        mutationFn: (query: string) => parseQuery(lapisUrl, { queries: [query], doFullValidation: true }),
        onSuccess: (results, query) => {
            const result = results[0];
            if (result.type === 'success') {
                if (allowedFields !== undefined) {
                    const usedFields = [...new Set(extractMetadataFields(result.filter))];
                    const disallowed = usedFields.filter((col) => !allowedFields.includes(col));
                    if (disallowed.length > 0) {
                        const listed = disallowed.map((col) => `"${col}"`).join(', ');
                        setValidationState({
                            type: 'error',
                            message: `Field ${listed} is not allowed. Allowed fields: ${allowedFields.join(', ')}.`,
                        });
                        onInput?.(query, false);
                        return;
                    }
                }
                setValidationState({ type: 'valid' });
                onInput?.(query, true);
            } else {
                setValidationState({ type: 'error', message: result.error });
                onInput?.(query, false);
            }
        },
        onError: (error, query) => {
            logger.error(`Failed to validate advanced query: ${error.message}`);
            setValidationState({ type: 'error', message: 'Validation is not possible right now.' });
            onInput?.(query, false);
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
            if (isRequired) {
                setValidationState({ type: 'error', message: EMPTY_REQUIRED_MESSAGE });
                onInput?.(undefined, false);
            } else {
                setValidationState({ type: 'idle' });
                onInput?.(undefined, true);
            }
            return;
        }

        setValidationState({ type: 'validating' });

        const timeout = setTimeout(() => validateQuery(inputValue), DEBOUNCE_MS);

        return () => clearTimeout(timeout);
    }, [inputValue, lapisUrl, onInput, validateQuery, isRequired]);

    if (!enabled) {
        return null;
    }

    // A required-but-empty query is invalid even before the user edits it (e.g. right after switching
    // to advanced-query mode), so surface the error immediately instead of waiting for an edit.
    const isEmpty = inputValue === undefined || inputValue === '';
    const displayState: ValidationState =
        isRequired && isEmpty ? { type: 'error', message: EMPTY_REQUIRED_MESSAGE } : validationState;

    const isError = displayState.type === 'error';
    const isValid = displayState.type === 'valid';
    const isValidating = displayState.type === 'validating';

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
                {isError && <ErrorIconWithTooltip message={displayState.message} tooltipClass={errorTooltipClass} />}
            </label>
        </div>
    );
};

const ErrorIconWithTooltip: FC<{ message: string; tooltipClass?: string }> = ({
    message,
    tooltipClass = 'tooltip-left lg:tooltip-right',
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`tooltip ${tooltipClass} z-1000 ${isOpen ? 'tooltip-open' : ''}`}>
            <div className='tooltip-content z-1000'>
                <div className='flex items-start gap-1'>
                    <span>{message}</span>
                    {isOpen && (
                        <button
                            type='button'
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
                type='button'
                className='iconify mdi--alert-circle text-error size-4 cursor-pointer'
                onClick={() => setIsOpen((open) => !open)}
                aria-label='Error'
            />
        </div>
    );
};
