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
            <MegaMenuSectionHeadline label={headline} labelBackgroundColor={headlineBackgroundColor} />
            <ul className='flex flex-col gap-2'>{children}</ul>
        </li>
    );
}

function MegaMenuSectionHeadline({ label, labelBackgroundColor }: { label: string; labelBackgroundColor: string }) {
    return <h3 className={`mb-4 p-2 text-lg font-bold bg-${labelBackgroundColor}`}>{label}</h3>;
}

export function MegaMenuListEntry({
    href,
    label,
    underlineColor,
}: {
    href: string;
    label: string;
    underlineColor: string;
}) {
    return (
        <li>
            <a className={`hover:underline hover:decoration-4 hover:decoration-${underlineColor}`} href={href}>
                {label}
            </a>
        </li>
    );
}
