import '@genspectrum/dashboard-components/components';
import type { LapisFilter, NamedLapisFilter } from '@genspectrum/dashboard-components/util';

type Views = 'bar' | 'line' | 'bubble' | 'table';
type ConfidenceIntervalMethod = 'none' | 'wilson';
type AxisMax = 'maxInData' | 'limitTo1' | number;

export function GsPrevalenceOverTime({
    numeratorFilter,
    denominatorFilter,
    lapisDateField,
    granularity,
    smoothingWindow,
    width,
    height,
    views,
    confidenceIntervalMethods,
    pageSize,
    yAxisMaxLinear,
}: {
    numeratorFilter: NamedLapisFilter[];
    denominatorFilter: LapisFilter;
    views?: Views[];
    granularity?: 'day' | 'week' | 'month' | 'year';
    smoothingWindow?: number;
    width?: string;
    height?: string;
    confidenceIntervalMethods?: ConfidenceIntervalMethod[];
    lapisDateField: string;
    pageSize?: boolean | number;
    yAxisMaxLinear?: AxisMax;
}) {
    return (
        <gs-prevalence-over-time
            numeratorFilter={JSON.stringify(numeratorFilter)}
            denominatorFilter={JSON.stringify(denominatorFilter)}
            granularity={granularity}
            smoothingWindow={smoothingWindow}
            views={JSON.stringify(views)}
            confidenceIntervalMethods={JSON.stringify(confidenceIntervalMethods)}
            width={width}
            height={height}
            lapisDateField={lapisDateField}
            pageSize={pageSize}
            yAxisMaxLinear={yAxisMaxLinear}
        ></gs-prevalence-over-time>
    );
}
