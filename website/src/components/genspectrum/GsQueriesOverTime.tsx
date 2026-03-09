import {
    views,
    type CustomColumn,
    type LapisFilter,
    type MeanProportionInterval,
    type QueryDefinition,
    type TemporalGranularity,
} from '@genspectrum/dashboard-components/util';
import { type FC } from 'react';

import { ComponentWrapper } from '../ComponentWrapper';

export type GsQueriesOverTimeProps = {
    collectionTitle?: string;
    lapisFilter: LapisFilter;
    queries: QueryDefinition[];
    granularity: TemporalGranularity;
    lapisDateField: string;
    height?: string;
    pageSizes?: number[];
    hideGaps?: true;
    initialMeanProportionInterval?: MeanProportionInterval;
    customColumns?: CustomColumn[];
};

export const GsQueriesOverTime: FC<GsQueriesOverTimeProps> = ({
    collectionTitle,
    lapisFilter,
    queries,
    granularity,
    lapisDateField,
    height,
    pageSizes,
    hideGaps,
    initialMeanProportionInterval,
    customColumns,
}) => {
    return (
        <ComponentWrapper
            title={'Collection over time' + (collectionTitle ? `: ${collectionTitle}` : '')}
            height={height}
        >
            <gs-queries-over-time
                width='100%'
                height={height ? '100%' : undefined}
                lapisFilter={lapisFilter}
                queries={queries}
                views={[views.grid]}
                granularity={granularity}
                lapisDateField={lapisDateField}
                hideGaps={hideGaps}
                pageSizes={pageSizes ?? [10, 20, 30, 40, 50]}
                initialMeanProportionInterval={initialMeanProportionInterval}
                customColumns={customColumns}
            ></gs-queries-over-time>
        </ComponentWrapper>
    );
};
