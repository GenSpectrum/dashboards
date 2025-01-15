import type { JSX, PropsWithChildren } from 'react';

export function ButtonWithIcon({
    children,
    icon,
    onClick,
}: PropsWithChildren<{
    icon: string;
    onClick?: JSX.IntrinsicElements['button']['onClick'];
}>) {
    return (
        <button className='flex items-center gap-1 hover:underline' onClick={onClick}>
            <div className={`iconify ${icon}`}></div>
            {children}
        </button>
    );
}
