import { type FC, type PropsWithChildren } from 'react';

export const ComponentsGrid: FC<PropsWithChildren> = ({ children }) => {
    return (
        <div className='grid grid-cols-[repeat(auto-fit,minmax(min(calc(100vw-16px),650px),1fr))] content-start gap-x-4 gap-y-6'>
            {children}
        </div>
    );
};
