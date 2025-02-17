import type { LapisFilter } from '@genspectrum/dashboard-components/util';
import { useEffect, useRef } from 'react';

import '@genspectrum/dashboard-components/components';

export function GsTextFilter<LapisField extends string>({
    lapisField,
    placeholderText,
    lapisFilter,
    width,
    onInputChange = () => {},
    value,
}: {
    lapisField: LapisField;
    placeholderText?: string;
    lapisFilter: LapisFilter;
    width?: string;
    onInputChange?: (input: { [key in LapisField]: string | undefined }) => void;
    value?: string | undefined;
}) {
    const textInputRef = useRef<HTMLElement>();

    useEffect(() => {
        const handleTextInputChange = (event: CustomEvent) => {
            onInputChange(event.detail);
        };

        const currentInputRef = textInputRef.current;
        if (currentInputRef !== undefined) {
            currentInputRef.addEventListener('gs-text-filter-changed', handleTextInputChange);
        }

        return () => {
            if (currentInputRef !== undefined) {
                currentInputRef.removeEventListener('gs-text-filter-changed', handleTextInputChange);
            }
        };
    }, [onInputChange]);

    return (
        <gs-text-filter
            ref={textInputRef}
            lapisField={lapisField}
            placeholderText={placeholderText}
            lapisFilter={JSON.stringify(lapisFilter)}
            width={width}
            value={value ?? ''}
        ></gs-text-filter>
    );
}
