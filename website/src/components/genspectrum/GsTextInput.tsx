import { useEffect, useRef } from 'react';

import '@genspectrum/dashboard-components';

export function GsTextInput<LapisField extends string>({
    lapisField,
    placeholderText,
    width,
    onInputChange = () => {},
}: {
    lapisField: LapisField;
    placeholderText?: string;
    width?: string;
    onInputChange?: (input: { [key in LapisField]: string | undefined }) => void;
}) {
    const textInputRef = useRef<HTMLElement>();

    useEffect(() => {
        const handleTextInputChange = (event: CustomEvent) => {
            onInputChange(event.detail);
        };

        const currentInputRef = textInputRef.current;
        if (currentInputRef !== undefined) {
            currentInputRef.addEventListener('gs-text-input-changed', handleTextInputChange);
        }

        return () => {
            if (currentInputRef !== undefined) {
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
        ></gs-text-input>
    );
}
