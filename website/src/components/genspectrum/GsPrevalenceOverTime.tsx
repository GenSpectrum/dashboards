import type {
    AxisMax,
    ConfidenceIntervalMethod,
    LapisFilter,
    NamedLapisFilter,
    PrevalenceOverTimeView,
    TemporalGranularity,
} from '@genspectrum/dashboard-components/util';
import type { FC } from 'react';

import { ComponentWrapper } from '../ComponentWrapper.tsx';

export type GsPrevalenceOverTimeProps = {
    numeratorFilters: NamedLapisFilter[];
    denominatorFilter: LapisFilter;
    views?: PrevalenceOverTimeView[];
    granularity?: TemporalGranularity;
    smoothingWindow?: number;
    width?: string;
    height?: string;
    confidenceIntervalMethods?: ConfidenceIntervalMethod[];
    lapisDateField: string;
    pageSize?: boolean | number;
    yAxisMaxLinear?: AxisMax;
};

export const GsPrevalenceOverTime: FC<GsPrevalenceOverTimeProps> = ({
    numeratorFilters,
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
}) => {
    return (
        <ComponentWrapper title='Prevalence over time' height={height}>
            <gs-prevalence-over-time
                numeratorFilters={JSON.stringify(numeratorFilters)}
                denominatorFilter={JSON.stringify(denominatorFilter)}
                granularity={granularity}
                smoothingWindow={smoothingWindow}
                views={JSON.stringify(views)}
                confidenceIntervalMethods={JSON.stringify(confidenceIntervalMethods)}
                width={width}
                height={height ? '100%' : undefined}
                lapisDateField={lapisDateField}
                pageSize={pageSize}
                yAxisMaxLinear={yAxisMaxLinear}
            ></gs-prevalence-over-time>
        </ComponentWrapper>
    );
};
