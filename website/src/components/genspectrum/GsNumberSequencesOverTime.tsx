import '@genspectrum/dashboard-components/components';
import type { NamedLapisFilter } from '@genspectrum/dashboard-components/util';

type Views = 'bar' | 'line' | 'table';

type TemporalGranularity = 'day' | 'week' | 'month' | 'year';

export function GsNumberSequencesOverTime({
    lapisDateField,
    lapisFilters,
    views,
    width,
    height,
    granularity,
    smoothingWindow,
    pageSize,
}: {
    lapisDateField: string;
    lapisFilters: NamedLapisFilter[];
    views?: Views[];
    width?: string;
    height?: string;
    granularity?: TemporalGranularity;
    smoothingWindow?: number;
    pageSize?: boolean | number;
}) {
    return (
        <gs-number-sequences-over-time
            lapisFilters={JSON.stringify(lapisFilters)}
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
