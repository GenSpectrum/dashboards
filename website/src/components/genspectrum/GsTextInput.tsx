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

        if (textInputRef.current) {
            textInputRef.current.addEventListener('gs-text-input-changed', handleTextInputChange);
        }

        return () => {
            if (textInputRef.current) {
                textInputRef.current.removeEventListener('gs-text-input-changed', handleTextInputChange);
            }
        };
    }, []);

    return (
        <gs-text-input
            ref={textInputRef}
            lapisField={lapisField}
            placeholderText={placeholderText}
            width={width}
        ></gs-text-input>
    );
}
