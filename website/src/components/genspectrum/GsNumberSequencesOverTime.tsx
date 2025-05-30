import '@genspectrum/dashboard-components/components';
import type { NamedLapisFilter } from '@genspectrum/dashboard-components/util';

type Views = 'bar' | 'line' | 'table';

type TemporalGranularity = 'day' | 'week' | 'month' | 'year';

export function GsNumberSequencesOverTime({
    lapisDateField,
    lapisFilter,
    views,
    width,
    height,
    granularity,
    smoothingWindow,
    pageSize,
}: {
    lapisDateField: string;
    lapisFilter: NamedLapisFilter[];
    views?: Views[];
    width?: string;
    height?: string;
    granularity?: TemporalGranularity;
    smoothingWindow?: number;
    pageSize?: boolean | number;
}) {
    return (
        <gs-number-sequences-over-time
            lapisFilter={JSON.stringify(lapisFilter)}
            lapisDateField={lapisDateField}
            views={JSON.stringify(views)}
            width={width}
            height={height}
            granularity={granularity}
            smoothingWindow={smoothingWindow}
            pageSize={pageSize}
        ></gs-number-sequences-over-time>
    );
}
