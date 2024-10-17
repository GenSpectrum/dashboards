import type { JSX } from 'react';

import type { WithClassName } from '../../types/WithClassName.ts';

export function ApplyFilterButton({
    onClick,
    className,
}: WithClassName<{
    onClick: JSX.IntrinsicElements['button']['onClick'];
}>) {
    return (
        <button className={`btn btn-primary ${className}`} onClick={onClick}>
            Apply filters
        </button>
    );
}
