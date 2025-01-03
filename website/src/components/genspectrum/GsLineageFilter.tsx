import type { LapisFilter } from '@genspectrum/dashboard-components/util';
import { useEffect, useRef } from 'react';

import '@genspectrum/dashboard-components/components';

export function GsLineageFilter<Lineage extends string>({
    lapisField,
    initialValue,
    placeholderText,
    width,
    onLineageChange = () => {},
    lapisFilter,
}: {
    lapisField: Lineage;
    initialValue?: string;
    placeholderText?: string;
    width?: string;
    onLineageChange?: (lineage: { [key in Lineage]: string | undefined }) => void;
    lapisFilter: LapisFilter;
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
            lapisFilter={JSON.stringify(lapisFilter)}
            placeholderText={placeholderText}
            initialValue={initialValue ?? ''}
            width={width}
            ref={lineageFilterRef}
        ></gs-lineage-filter>
    );
}
