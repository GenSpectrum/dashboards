import type { LapisFilter } from '@genspectrum/dashboard-components/util';
import type { FC } from 'react';

import { ComponentHeadline } from '../ComponentHeadline';

export type GsStatisticsProps = {
    numeratorFilter: LapisFilter;
    denominatorFilter: LapisFilter;
};

export const GsStatistics: FC<GsStatisticsProps> = ({ numeratorFilter, denominatorFilter }) => {
    return (
        <div className='h-56 sm:h-32'>
            <ComponentHeadline title='Stats' />
            <gs-statistics
                numeratorFilter={JSON.stringify(numeratorFilter)}
                denominatorFilter={JSON.stringify(denominatorFilter)}
                width='100%'
                height='100%'
            />
        </div>
    );
};
