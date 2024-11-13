import { MegaMenu, MegaMenuListEntry, MegaMenuSection } from './MegaMenu.tsx';
import { headerHeight } from './headerConstants.ts';
import { organismConfig } from '../../../types/Organism.ts';
import type { WithClassName } from '../../../types/WithClassName.ts';
import { Page } from '../../../types/pages.ts';
import { ServerSide } from '../../../views/serverSideRouting.ts';

export function Navigation() {
    const pathogenMegaMenuSections = Object.values(organismConfig).map((organism) => {
        const megaMenuSections = Object.values(ServerSide.routing.views[organism.organism]).map((view) => {
            const href = view.getDefaultPageState();
            return {
                label: view.labelLong,
                href,
                underlineColor: organism.menuListEntryDecoration,
                externalLink: false,
            };
        });
        if (organism.organism === 'covid') {
            megaMenuSections.push({
                label: 'CoV-Spectrum',
                href: 'https://cov-spectrum.org',
                underlineColor: organism.menuListEntryDecoration,
                externalLink: true,
            });
        }
        return {
            headline: organism.label,
            headlineBackgroundColor: 'bg-orange-400',
            navigationEntries: megaMenuSections,
        };
    });

    return (
        <nav className=''>
            <ul className='flex space-x-8'>
                <li className='group'>
                    <NavigationEntry
                        label='Pathogens'
                        className='group-hover:border-b-2 group-hover:border-black group-hover:text-black'
                    />
                    <MegaMenu className='hidden group-hover:block'>
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
                </li>
                <li className='h-full'>
                    <NavigationEntry href={Page.dataSources} label='Data sources' />
                </li>
            </ul>
        </nav>
    );
}

export type NavigationEntryProps = {
    label: string;
    href?: string;
};

export function NavigationEntry({ href, label, className }: WithClassName<NavigationEntryProps>) {
    const content = (
        <div className={`flex ${headerHeight} items-center text-gray-500 transition-all hover:text-black ${className}`}>
            {label}
        </div>
    );

    if (href !== undefined) {
        return <a href={href}>{content}</a>;
    }

    return <button>{content}</button>;
}
