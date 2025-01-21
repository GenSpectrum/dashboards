import { useEffect, useRef } from 'react';

import '@genspectrum/dashboard-components/components';

export function GsTextInput<LapisField extends string>({
    lapisField,
    placeholderText,
    width,
    onInputChange = () => {},
    value,
}: {
    lapisField: LapisField;
    placeholderText?: string;
    width?: string;
    onInputChange?: (input: { [key in LapisField]: string | undefined }) => void;
    value?: string | undefined;
}) {
    const textInputRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const handleTextInputChange = (event: CustomEvent) => {
            onInputChange(event.detail);
        };

        const currentInputRef = textInputRef.current;
        if (currentInputRef) {
            currentInputRef.addEventListener('gs-text-input-changed', handleTextInputChange);
        }

        return () => {
            if (currentInputRef) {
                currentInputRef.removeEventListener('gs-text-input-changed', handleTextInputChange);
            }
        };
    }, [onInputChange]);

    return (
        <gs-text-input
            ref={textInputRef}
            lapisField={lapisField}
            placeholderText={placeholderText}
            width={width}
            value={value ?? ''}
        ></gs-text-input>
    );
}
