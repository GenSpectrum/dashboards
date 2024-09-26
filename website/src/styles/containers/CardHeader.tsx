import type { PropsWithChildren, ReactNode } from 'react';
import type { WithClassName } from '../../types/WithClassName.ts';

export function CardHeader({ children, className = '' }: PropsWithChildren<WithClassName>) {
    return <div className={`mb-4 flex items-center justify-between ${className}`}>{children}</div>;
}
