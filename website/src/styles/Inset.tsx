import type { PropsWithChildren } from 'react';

import type { WithClassName } from '../types/WithClassName.ts';

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments -- false positive, it claims that PropsWithChildren is the default, but that's not true
export function Inset({ children, className }: WithClassName<PropsWithChildren>) {
    return <div className={`rounded-md border-[1px] border-gray-200 shadow-inner ${className}`}>{children}</div>;
}
