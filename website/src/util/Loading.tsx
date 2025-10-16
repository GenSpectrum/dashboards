import { type FC } from 'react';

export const Loading: FC = () => (
    <div
        aria-label='Loading'
        className='flex h-full w-full items-center justify-center rounded-md border-2 border-gray-100'
    >
        <div className='loading loading-spinner loading-md text-neutral-500' />
    </div>
);
