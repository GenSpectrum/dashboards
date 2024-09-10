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

        if (lineageFilterRef.current) {
            lineageFilterRef.current.addEventListener('gs-lineage-filter-changed', handleLineageChange);
        }

        return () => {
            if (lineageFilterRef.current) {
                lineageFilterRef.current.removeEventListener('gs-lineage-filter-changed', handleLineageChange);
            }
        };
    }, []);

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
