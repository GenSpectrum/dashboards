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
    headlineBackgroundColor: string;
}

export function MegaMenuSection({
    headline,
    children,
    headlineBackgroundColor,
}: PropsWithChildren<MegaMenuSectionProps>) {
    return (
        <li>
            <MegaMenuSectionHeadline label={headline} className={headlineBackgroundColor} />
            <ul className='flex flex-col gap-2'>{children}</ul>
        </li>
    );
}

function MegaMenuSectionHeadline({ label, className }: WithClassName<{ label: string }>) {
    return <h3 className={`mb-4 p-2 text-lg font-bold ${className}`}>{label}</h3>;
}

export function MegaMenuListEntry({
    href,
    label,
    className,
    externalLink = false,
}: WithClassName<{
    href: string;
    label: string;
    externalLink?: boolean;
}>) {
    return (
        <li>
            <a
                className={`flex items-center p-2 hover:underline hover:decoration-4 ${className} ${externalLink ? 'after:iconify after:ml-0.5 after:mdi--external-link' : ''}`}
                href={href}
            >
                {label}
            </a>
        </li>
    );
}
