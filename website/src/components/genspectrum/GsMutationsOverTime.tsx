import type { TemporalGranularity, LapisFilter, SequenceType } from '@genspectrum/dashboard-components/util';
import { type FC } from 'react';
import React from 'react';

import { ComponentWrapper } from '../ComponentWrapper';

export type GsMutationsOverTimeProps = {
    lapisFilter: LapisFilter;
    sequenceType: SequenceType;
    granularity: TemporalGranularity;
    lapisDateField: string;
    displayMutations?: string[];
    height?: string;
    pageSizes?: number[];
    useNewEndpoint?: boolean;
};

export const GsMutationsOverTime: FC<GsMutationsOverTimeProps> = ({
    lapisFilter,
    sequenceType,
    granularity,
    lapisDateField,
    displayMutations,
    height,
    pageSizes,
    useNewEndpoint,
}) => {
    return (
        <ComponentWrapper
            title={sequenceType === 'nucleotide' ? 'Nucleotide mutations over time' : 'Amino acid mutations over time'}
            height={height}
        >
            <gs-mutations-over-time
                width='100%'
                height={height ? '100%' : undefined}
                lapisFilter={JSON.stringify(lapisFilter)}
                sequenceType={sequenceType}
                views='["grid"]'
                granularity={granularity}
                lapisDateField={lapisDateField}
                displayMutations={displayMutations ? JSON.stringify(displayMutations) : undefined}
                useNewEndpoint={useNewEndpoint ?? false}
                pageSizes={JSON.stringify(pageSizes ?? [10, 20, 30, 40, 50])}
            ></gs-mutations-over-time>
        </ComponentWrapper>
    );
};
