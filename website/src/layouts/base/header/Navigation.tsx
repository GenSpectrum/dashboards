import type { PropsWithChildren } from 'react';

import { MegaMenu, MegaMenuListEntry, MegaMenuSection } from './MegaMenu.tsx';
import { getPathogenMegaMenuSections } from './getPathogenMegaMenuSections.ts';
import { headerHeight } from './headerConstants.ts';
import { Page } from '../../../types/pages.ts';

export function Navigation() {
    const pathogenMegaMenuSections = Object.values(getPathogenMegaMenuSections());

    return (
        <nav>
            <ul className='flex space-x-8'>
                <li>
                    <MegaMenuNavigationEntry label='Pathogens'>
                        <MegaMenu>
                            {pathogenMegaMenuSections.map((section) => (
                                <MegaMenuSection key={section.headline} {...section}>
                                    {section.navigationEntries.map((entry) => (
                                        <MegaMenuListEntry
                                            key={entry.label}
                                            label={entry.label}
                                            externalLink={entry.externalLink}
                                            href={entry.href}
                                            className={entry.underlineColor}
                                        />
                                    ))}
                                </MegaMenuSection>
                            ))}
                        </MegaMenu>
                    </MegaMenuNavigationEntry>
                </li>
                <li className='h-full'>
                    <SimpleNavigationEntry href={Page.dataSources}>Data sources</SimpleNavigationEntry>
                </li>
            </ul>
        </nav>
    );
}

const commonNavigationEntryCss = `flex ${headerHeight} items-center text-gray-500 transition-all hover:border-b-2 hover:border-black hover:text-black`;

export type SimpleNavigationEntryProps = {
    href: string;
};

function SimpleNavigationEntry({ href, children }: PropsWithChildren<SimpleNavigationEntryProps>) {
    return (
        <a className={commonNavigationEntryCss} href={href}>
            {children}
        </a>
    );
}

const overlayThatClosesMenuOnClickOutside =
    'before:cursor-default group-open:before:bg-gray-500/30 group-open:before:block group-open:before:absolute group-open:before:top-0 group-open:before:left-0 group-open:before:w-full group-open:before:h-[90vh] group-open:before:top-[10vh]';

const expandableIndicator = 'after:iconify after:ml-1 after:mdi--chevron-down';

const openIndicator = 'group-open:border-b-2 group-open:border-black group-open:text-black';

function MegaMenuNavigationEntry({ label, children }: PropsWithChildren<{ label: string }>) {
    return (
        <details className='group'>
            <summary
                className={`cursor-pointer ${commonNavigationEntryCss} ${overlayThatClosesMenuOnClickOutside} ${expandableIndicator} ${openIndicator}`}
            >
                {label}
            </summary>

            {children}
        </details>
    );
}
