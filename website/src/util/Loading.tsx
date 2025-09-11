import React, { type FC } from 'react';

export const Loading: FC = () => (
    <div
        aria-label="Loading"
        className="h-full w-full border-2 border-gray-100 rounded-md flex justify-center items-center"
    >
        <div className="loading loading-spinner loading-md text-neutral-500" />
    </div>
);
