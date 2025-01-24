import type { LapisFilter } from '@genspectrum/dashboard-components/util';
import { useEffect, useRef } from 'react';

import '@genspectrum/dashboard-components/components';

export function GsLineageFilter<Lineage extends string>({
    lapisField,
    value,
    lapisFilter,
    placeholderText,
    width,
    onLineageChange = () => {},
}: {
    lapisField: Lineage;
    value?: string;
    lapisFilter: LapisFilter;
    placeholderText?: string;
    width?: string;
    onLineageChange?: (lineage: { [key in Lineage]: string | undefined }) => void;
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
            value={value ?? ''}
            width={width}
            ref={lineageFilterRef}
            lapisFilter={lapisFilter}
        ></gs-lineage-filter>
    );
}
