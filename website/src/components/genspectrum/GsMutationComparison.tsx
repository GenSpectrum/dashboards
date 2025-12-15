import type { NamedLapisFilter, SequenceType } from '@genspectrum/dashboard-components/util';
import type { FC } from 'react';

import { defaultTablePageSize } from '../../views/View';
import { ComponentWrapper } from '../ComponentWrapper.tsx';

export type GsMutationComparisonProps = {
    lapisFilters: NamedLapisFilter[];
    sequenceType: SequenceType;
    height?: string;
    pageSize?: number;
};

export const GsMutationComparison: FC<GsMutationComparisonProps> = ({
    lapisFilters,
    sequenceType,
    height,
    pageSize,
}) => {
    return (
        <ComponentWrapper
            title={sequenceType === 'nucleotide' ? 'Nucleotide changes' : 'Amino acid changes'}
            height={height}
        >
            <gs-mutation-comparison
                lapisFilters={JSON.stringify(lapisFilters)}
                sequenceType={sequenceType}
                views='["venn", "table"]'
                pageSize={pageSize ?? defaultTablePageSize}
                width='100%'
                height={height ? '100%' : undefined}
            ></gs-mutation-comparison>
        </ComponentWrapper>
    );
};
