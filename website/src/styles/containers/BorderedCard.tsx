import { type PropsWithChildren } from 'react';

import type { WithClassName } from '../../types/WithClassName.ts';

export function BorderedCard({ children, className }: PropsWithChildren<WithClassName>) {
    return (
        <div className={`bordered flex flex-col gap-6 rounded-xl border-2 border-gray-200 p-4 ${className ?? ''}`}>
            {children}
        </div>
    );
}
