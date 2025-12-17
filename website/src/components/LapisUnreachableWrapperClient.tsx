import { useQuery } from '@tanstack/react-query';
import { type FC, type ReactNode } from 'react';

import { checkLapisHealth } from '../lapis/checkLapisHealth';

type LapisUnreachableWrapperClientProps = {
    lapisUrl: string;
    children: ReactNode;
};

export const LapisUnreachableWrapperClient: FC<LapisUnreachableWrapperClientProps> = ({ lapisUrl, children }) => {
    const { data: isReachable, isLoading } = useQuery({
        queryKey: ['lapis-reachable', lapisUrl],
        queryFn: () => checkLapisHealth(lapisUrl),
        retry: 2,
        retryDelay: 1000,
        staleTime: 60000, // Consider data fresh for 1 minute
    });

    if (!isLoading && isReachable === false) {
        return (
            <div className='flex h-full w-full items-center justify-center rounded-md border-2 border-red-200 bg-red-50 p-8'>
                <div className='text-center'>
                    <h2 className='mb-2 text-xl font-bold text-red-700'>Data Source Unreachable</h2>
                    <p className='text-red-600'>
                        Unable to connect to the data source at{' '}
                        <code className='rounded bg-red-100 px-1'>{lapisUrl}</code>.
                    </p>
                    <p className='mt-2 text-sm text-red-500'>
                        Please try again later or contact support if the problem persists.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
