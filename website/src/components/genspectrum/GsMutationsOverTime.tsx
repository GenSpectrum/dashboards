import type { TemporalGranularity, LapisFilter, SequenceType } from '@genspectrum/dashboard-components/util';
import { type FC } from 'react';

import { ComponentWrapper } from '../ComponentWrapper';

export type GsMutationsOverTimeProps = {
    lapisFilter: LapisFilter;
    sequenceType: SequenceType;
    granularity: TemporalGranularity;
    lapisDateField: string;
    height?: string;
    pageSizes?: number[];
};

export const GsMutationsOverTime: FC<GsMutationsOverTimeProps> = ({
    lapisFilter,
    sequenceType,
    granularity,
    lapisDateField,
    height,
    pageSizes,
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
                pageSizes={pageSizes}
            ></gs-mutations-over-time>
        </ComponentWrapper>
    );
};
