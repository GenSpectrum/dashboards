import {
    type TemporalGranularity,
    type LapisFilter,
    type SequenceType,
    type MeanProportionInterval,
    type CustomColumn,
    views,
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
    hideGaps?: true;
    initialMeanProportionInterval?: MeanProportionInterval;
    customColumns?: CustomColumn[];
};

export const GsMutationsOverTime: FC<GsMutationsOverTimeProps> = ({
    lapisFilter,
    sequenceType,
    granularity,
    lapisDateField,
    displayMutations,
    height,
    pageSizes,
    hideGaps,
    initialMeanProportionInterval,
    customColumns,
}) => {
    return (
        <ComponentWrapper
            title={sequenceType === 'nucleotide' ? 'Nucleotide mutations over time' : 'Amino acid mutations over time'}
            height={height}
        >
            <gs-mutations-over-time
                width='100%'
                height={height ? '100%' : undefined}
                lapisFilter={lapisFilter}
                sequenceType={sequenceType}
                views={[views.grid]}
                granularity={granularity}
                lapisDateField={lapisDateField}
                displayMutations={displayMutations ? JSON.stringify(displayMutations) : undefined}
                hideGaps={hideGaps}
                pageSizes={pageSizes ?? [10, 20, 30, 40, 50]}
                initialMeanProportionInterval={
                    initialMeanProportionInterval ? JSON.stringify(initialMeanProportionInterval) : undefined
                }
                customColumns={customColumns ? JSON.stringify(customColumns) : undefined}
            ></gs-mutations-over-time>
        </ComponentWrapper>
    );
};
