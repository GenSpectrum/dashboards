import { type AggregateView, type LapisFilter } from '@genspectrum/dashboard-components/util';
import { type FC } from 'react';

import { defaultTablePageSize } from '../../views/View';
import { ComponentWrapper } from '../ComponentWrapper';

export type GsAggregateProps = {
    title: string;
    fields: string[];
    lapisFilter: LapisFilter;
    views: AggregateView[];
    height?: string;
    pageSize?: number;
};

export const GsAggregate: FC<GsAggregateProps> = ({ title, height, fields, lapisFilter, views, pageSize }) => {
    return (
        <ComponentWrapper title={title} height={height}>
            <gs-aggregate
                views={JSON.stringify(views)}
                fields={JSON.stringify(fields)}
                lapisFilter={JSON.stringify(lapisFilter)}
                pageSize={pageSize ?? defaultTablePageSize}
                width='100%'
                height={height ? '100%' : undefined}
            ></gs-aggregate>
        </ComponentWrapper>
    );
};
