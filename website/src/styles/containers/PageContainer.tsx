import { type PropsWithChildren } from 'react';

export function PageContainer({ children }: PropsWithChildren) {
    return <div className='container mx-auto min-w-72'>{children}</div>;
}
