import { type ReactNode } from 'react';

export function PageContainer({ children }: { children: ReactNode }) {
    return <div className='container mx-auto min-w-72'>{children}</div>;
}
