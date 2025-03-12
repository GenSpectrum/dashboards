import type { LapisFilter } from '@genspectrum/dashboard-components/util';

import { GsLineageFilter } from '../genspectrum/GsLineageFilter.tsx';
import { GsTextFilter } from '../genspectrum/GsTextFilter.tsx';

export type LineageFilterConfig = {
    placeholderText: string;
    lapisField: string;
    filterType: 'lineage' | 'text';
};

export function LineageFilterInput({
    lineageFilterConfig,
    onLineageChange,
    lapisFilter,
    value,
}: {
    lineageFilterConfig: LineageFilterConfig;
    onLineageChange: (lineage: string | undefined) => void;
    lapisFilter: LapisFilter;
    value: string | undefined;
}) {
    switch (lineageFilterConfig.filterType) {
        case 'lineage':
            return (
                <label className='form-control'>
                    <div className='label'>
                        <span className='label-text'>{lineageFilterConfig.placeholderText}</span>
                    </div>
                    <GsLineageFilter
                        lapisField={lineageFilterConfig.lapisField}
                        placeholderText={lineageFilterConfig.placeholderText}
                        onLineageChange={(lineage) => onLineageChange(lineage[lineageFilterConfig.lapisField])}
                        value={value}
                        lapisFilter={lapisFilter}
                    />
                </label>
            );

        case 'text':
            return (
                <label className='form-control'>
                    <div className='label'>
                        <span className='label-text'>{lineageFilterConfig.placeholderText}</span>
                    </div>
                    <GsTextFilter
                        lapisField={lineageFilterConfig.lapisField}
                        placeholderText={lineageFilterConfig.placeholderText}
                        onInputChange={(lineage) => onLineageChange(lineage[lineageFilterConfig.lapisField])}
                        value={value}
                        lapisFilter={lapisFilter}
                    />
                </label>
            );
    }
}
