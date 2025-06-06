import { type LapisFilter, type SequenceType } from '@genspectrum/dashboard-components/util';
import { type FC } from 'react';

import { defaultTablePageSize } from '../../views/View.ts';
import { ComponentWrapper } from '../ComponentWrapper';

export type GsMutationsProps = {
    lapisFilter: LapisFilter;
    baselineLapisFilter?: LapisFilter;
    sequenceType: SequenceType;
    pageSize?: number;
    height?: string;
};

export const GsMutations: FC<GsMutationsProps> = ({
    lapisFilter,
    baselineLapisFilter,
    sequenceType,
    pageSize,
    height,
}) => {
    return (
        <ComponentWrapper
            title={sequenceType === 'nucleotide' ? 'Nucleotide mutations' : 'Amino acid mutations'}
            height={height}
        >
            <gs-mutations
                lapisFilter={JSON.stringify(lapisFilter)}
                baselineLapisFilter={
                    baselineLapisFilter === undefined ? undefined : JSON.stringify(baselineLapisFilter)
                }
                sequenceType={sequenceType}
                views='["grid", "table", "insertions"]'
                pageSize={pageSize ?? defaultTablePageSize}
                width='100%'
                height={height ? '100%' : undefined}
            ></gs-mutations>
        </ComponentWrapper>
    );
};
