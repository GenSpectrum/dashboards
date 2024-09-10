import type { ReactNode } from 'react';

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <div className='mb-2'>{children}</div>;
}
