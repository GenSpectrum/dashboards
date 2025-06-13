import type { LapisFilter } from '@genspectrum/dashboard-components/util';
import { type FC } from 'react';

import { defaultTablePageSize } from '../../views/View';
import { ComponentWrapper } from '../ComponentWrapper';

export type GsRelativeGrowthAdvantageProps = {
    numeratorFilter: LapisFilter;
    denominatorFilter: LapisFilter;
    lapisDateField?: string;
    height?: string;
};

export const GsRelativeGrowthAdvantage: FC<GsRelativeGrowthAdvantageProps> = ({
    numeratorFilter,
    denominatorFilter,
    lapisDateField,
    height,
}) => {
    return (
        <ComponentWrapper title='Relative growth advantage' height={height}>
            <gs-relative-growth-advantage
                numeratorFilter={JSON.stringify(numeratorFilter)}
                denominatorFilter={JSON.stringify(denominatorFilter)}
                generationTime='7'
                pageSize={defaultTablePageSize}
                width='100%'
                height={height ? '100%' : undefined}
                lapisDateField={lapisDateField}
            ></gs-relative-growth-advantage>
        </ComponentWrapper>
    );
};
