import { useQuery } from '@tanstack/react-query';
import type { FC } from 'react';

import { getLastUpdatedDate } from '../../lapis/getLastUpdatedDate';

interface LastUpdatedInfoProps {
    lapisUrl: string;
}

export const LastUpdatedInfo: FC<LastUpdatedInfoProps> = ({ lapisUrl }) => {
    const { data: lastUpdatedDate } = useQuery({
        queryKey: ['lastUpdatedDate', lapisUrl],
        queryFn: () => getLastUpdatedDate(lapisUrl),
        throwOnError: true,
    });

    return <span className='flex justify-center p-2 text-xs'>Data last updated: {lastUpdatedDate ?? 'unknown'}</span>;
};
