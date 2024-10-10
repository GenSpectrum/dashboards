import { useEffect, useRef } from 'react';

import '@genspectrum/dashboard-components';

export function GsLineageFilter<Lineage extends string>({
    lapisField,
    initialValue,
    placeholderText,
    width,
    onLineageChange = () => {},
}: {
    lapisField: Lineage;
    initialValue?: string;
    placeholderText?: string;
    width?: string;
    onLineageChange?: (location: { [key in Lineage]: string | undefined }) => void;
}) {
    const lineageFilterRef = useRef<HTMLElement>();

    useEffect(() => {
        const handleLineageChange = (event: CustomEvent) => {
            onLineageChange(event.detail);
        };

        const currentLineageFilterRef = lineageFilterRef.current;
        if (currentLineageFilterRef) {
            currentLineageFilterRef.addEventListener('gs-lineage-filter-changed', handleLineageChange);
        }

        return () => {
            if (currentLineageFilterRef) {
                currentLineageFilterRef.removeEventListener('gs-lineage-filter-changed', handleLineageChange);
            }
        };
    }, [onLineageChange]);

    return (
        <gs-lineage-filter
            lapisField={lapisField}
            placeholderText={placeholderText}
            initialValue={initialValue}
            width={width}
            ref={lineageFilterRef}
        ></gs-lineage-filter>
    );
}
