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
    onLineageMultiChange = () => {},
    hideCounts,
    multiSelect,
}: {
    lapisField: Lineage;
    value?: string | string[];
    lapisFilter: LapisFilter;
    placeholderText?: string;
    width?: string;
    onLineageChange?: (lineage: { [key in Lineage]: string | undefined }) => void;
    onLineageMultiChange?: (lineage: { [key in Lineage]: string[] | undefined }) => void;
    hideCounts?: true;
    multiSelect?: true;
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

    useEffect(() => {
        const currentLineageFilterRef = lineageFilterRef.current;
        if (!currentLineageFilterRef) {
            return;
        }

        const handleLineageMultiChange = (event: CustomEvent) => {
            onLineageMultiChange(event.detail);
        };

        currentLineageFilterRef.addEventListener(gsEventNames.lineageFilterMultiChanged, handleLineageMultiChange);

        return () => {
            currentLineageFilterRef.removeEventListener(
                gsEventNames.lineageFilterMultiChanged,
                handleLineageMultiChange,
            );
        };
    }, [onLineageMultiChange]);

    const valueProperty = value === undefined ? (multiSelect ? '[]' : '') : multiSelect ? JSON.stringify(value) : value;

    return (
        <gs-lineage-filter
            lapisField={lapisField}
            placeholderText={placeholderText}
            value={valueProperty}
            width={width}
            ref={lineageFilterRef}
            lapisFilter={JSON.stringify(lapisFilter)}
            hideCounts={hideCounts}
            multiSelect={multiSelect}
        ></gs-lineage-filter>
    );
}
