import { type PropsWithChildren } from 'react';

import type { WithClassName } from '../../types/WithClassName.ts';

type InputLabelProps = PropsWithChildren<
    WithClassName<{
        title: string;
        description: string;
    }>
>;

export function InputLabel({ children, className, title, description }: InputLabelProps) {
    return (
        <label className={`w-full ${className ?? ''}`}>
            <div className='mb-2'>{title}</div>
            <p className='mb-2 max-w-xl text-sm text-gray-400'>{description}</p>
            {children}
        </label>
    );
}
