import type {
    TemporalGranularity,
    LapisFilter,
    SequenceType,
    MeanProportionInterval,
} from '@genspectrum/dashboard-components/util';
import { type FC } from 'react';

import { ComponentWrapper } from '../ComponentWrapper';

export type GsMutationsOverTimeProps = {
    lapisFilter: LapisFilter;
    sequenceType: SequenceType;
    granularity: TemporalGranularity;
    lapisDateField: string;
    displayMutations?: string[];
    height?: string;
    pageSizes?: number[];
    useNewEndpoint?: true;
    hideGaps?: true;
    initialMeanProportionInterval?: MeanProportionInterval;
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
    hideGaps,
    initialMeanProportionInterval,
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
                useNewEndpoint={useNewEndpoint}
                hideGaps={hideGaps}
                pageSizes={JSON.stringify(pageSizes ?? [10, 20, 30, 40, 50])}
                initialMeanProportionInterval={
                    initialMeanProportionInterval ? JSON.stringify(initialMeanProportionInterval) : undefined
                }
            ></gs-mutations-over-time>
        </ComponentWrapper>
    );
};
