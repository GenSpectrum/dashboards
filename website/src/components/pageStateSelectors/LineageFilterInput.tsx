import type { LapisFilter } from '@genspectrum/dashboard-components/util';

import { GsLineageFilter } from '../genspectrum/GsLineageFilter.tsx';
import { GsTextFilter } from '../genspectrum/GsTextFilter.tsx';

export type LineageFilterConfig = {
    initialValue: string | undefined;
    placeholderText: string;
    lapisField: string;
    filterType: 'lineage' | 'text';
};

export function LineageFilterInput({
    lineageFilterConfig,
    onLineageChange,
    lapisFilter,
}: {
    lineageFilterConfig: LineageFilterConfig;
    onLineageChange: (lineage: string | undefined) => void;
    lapisFilter: LapisFilter;
}) {
    switch (lineageFilterConfig.filterType) {
        case 'lineage':
            return (
                <GsLineageFilter
                    lapisField={lineageFilterConfig.lapisField}
                    placeholderText={lineageFilterConfig.placeholderText}
                    onLineageChange={(lineage) => onLineageChange(lineage[lineageFilterConfig.lapisField])}
                    value={lineageFilterConfig.initialValue}
                    lapisFilter={lapisFilter}
                />
            );

        case 'text':
            return (
                <GsTextFilter
                    lapisField={lineageFilterConfig.lapisField}
                    placeholderText={lineageFilterConfig.placeholderText}
                    onInputChange={(lineage) => onLineageChange(lineage[lineageFilterConfig.lapisField])}
                    value={lineageFilterConfig.initialValue}
                    lapisFilter={lapisFilter}
                />
            );
    }
}
