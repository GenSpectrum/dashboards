import type {
    CustomColumn,
    LapisFilter,
    MeanProportionInterval,
    QueryDefinition,
    TemporalGranularity,
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
                lapisFilter={JSON.stringify(lapisFilter)}
                queries={JSON.stringify(queries)}
                views='["grid"]'
                granularity={granularity}
                lapisDateField={lapisDateField}
                hideGaps={hideGaps}
                pageSizes={JSON.stringify(pageSizes ?? [10, 20, 30, 40, 50])}
                initialMeanProportionInterval={
                    initialMeanProportionInterval ? JSON.stringify(initialMeanProportionInterval) : undefined
                }
                customColumns={customColumns ? JSON.stringify(customColumns) : undefined}
            ></gs-queries-over-time>
        </ComponentWrapper>
    );
};
