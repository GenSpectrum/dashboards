import type { ReactNode } from 'react';

export function CardHeader({ children }: { children: ReactNode }) {
    return <div className='mb-4 flex place-content-between items-center'>{children}</div>;
}
