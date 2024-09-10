import { type ReactNode } from 'react';

export function PageHeadline({ children }: { children: ReactNode }) {
    return <h1 className='mb-4 mt-6 text-xl font-bold'>{children}</h1>;
}
