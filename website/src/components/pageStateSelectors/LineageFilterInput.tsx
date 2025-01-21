import { GsLineageFilter } from '../genspectrum/GsLineageFilter.tsx';
import { GsTextInput } from '../genspectrum/GsTextInput.tsx';

export type LineageFilterConfig = {
    initialValue: string | undefined;
    placeholderText: string;
    lapisField: string;
    filterType: 'lineage' | 'text';
};

export function LineageFilterInput({
    lineageFilterConfig,
    onLineageChange,
}: {
    lineageFilterConfig: LineageFilterConfig;
    onLineageChange: (lineage: string | undefined) => void;
}) {
    switch (lineageFilterConfig.filterType) {
        case 'lineage':
            return (
                <GsLineageFilter
                    lapisField={lineageFilterConfig.lapisField}
                    placeholderText={lineageFilterConfig.placeholderText}
                    onLineageChange={(lineage) => onLineageChange(lineage[lineageFilterConfig.lapisField])}
                    value={lineageFilterConfig.initialValue}
                />
            );

        case 'text':
            return (
                <GsTextInput
                    lapisField={lineageFilterConfig.lapisField}
                    placeholderText={lineageFilterConfig.placeholderText}
                    onInputChange={(lineage) => onLineageChange(lineage[lineageFilterConfig.lapisField])}
                    value={lineageFilterConfig.initialValue}
                />
            );
    }
}
