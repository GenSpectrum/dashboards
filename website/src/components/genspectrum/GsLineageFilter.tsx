import { gsEventNames, type LapisFilter } from '@genspectrum/dashboard-components/util';
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
        const currentLineageFilterRef = lineageFilterRef.current;
        if (!currentLineageFilterRef) {
            return;
        }

        const handleLineageChange = (event: CustomEvent) => {
            onLineageChange(event.detail);
        };

        currentLineageFilterRef.addEventListener(gsEventNames.lineageFilterChanged, handleLineageChange);

        return () => {
            currentLineageFilterRef.removeEventListener(gsEventNames.lineageFilterChanged, handleLineageChange);
        };
    }, [onLineageChange]);

    return (
        <gs-lineage-filter
            lapisField={lapisField}
            placeholderText={placeholderText}
            value={value ?? ''}
            width={width}
            ref={lineageFilterRef}
            lapisFilter={JSON.stringify(lapisFilter)}
        ></gs-lineage-filter>
    );
}
