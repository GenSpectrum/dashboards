import type { PropsWithChildren } from 'react';

import type { WithClassName } from '../types/WithClassName.ts';

export function Inset({ children, className }: WithClassName<PropsWithChildren>) {
    return <div className={`rounded-md border-[1px] shadow-inner ${className}`}>{children}</div>;
}
