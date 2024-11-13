import type { PropsWithChildren } from 'react';

import type { WithClassName } from '../../../types/WithClassName.ts';

export function MegaMenu({ className, children }: PropsWithChildren<WithClassName>) {
    return (
        <div className={`absolute left-0 w-screen bg-white shadow-lg ${className}`}>
            <ul className='grid grid-cols-2 gap-4 border-2 border-gray-100 p-8 xl:grid-cols-6'>{children}</ul>
        </div>
    );
}

export interface MegaMenuSectionProps {
    headline: string;
}

export function MegaMenuSection({ headline, children }: PropsWithChildren<MegaMenuSectionProps>) {
    return (
        <li className='group'>
            <h3 className='mb-4 bg-primary p-2 text-lg font-bold group-hover:bg-primaryFocus'>{headline}</h3>
            <ul className='peer-hover flex flex-col gap-2'>{children}</ul>
        </li>
    );
}

export function MegaMenuListEntry({
    href,
    label,
    externalLink = false,
}: WithClassName<{
    href: string;
    label: string;
    externalLink?: boolean;
}>) {
    return (
        <li>
            <a
                className={`flex items-center p-2 hover:underline hover:decoration-primaryFocus hover:decoration-4 ${externalLink ? 'after:iconify after:ml-0.5 after:mdi--external-link' : ''}`}
                href={href}
            >
                {label}
            </a>
        </li>
    );
}
