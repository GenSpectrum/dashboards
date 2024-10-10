import { MegaMenu, MegaMenuListEntry, MegaMenuSection } from './MegaMenu.tsx';
import { headerHeight } from './headerConstants.ts';
import { ServerSide } from '../../../routes/serverSideRouting.ts';
import { organismConfig } from '../../../types/Organism.ts';
import type { WithClassName } from '../../../types/WithClassName.ts';

export function Navigation() {
    const pathogenMegaMenuSections = Object.values(organismConfig).map((organism) => {
        const megaMenuSections = ServerSide.routing.views[organism.organism].map((view) => {
            const href = ServerSide.routing.toUrl(ServerSide.routing.getDefaultRoute(view.pathname)!);
            return {
                label: view.labelLong,
                href,
                underlineColor: organism.primaryColor,
            };
        });
        if (organism.organism === 'covid') {
            megaMenuSections.push({
                label: 'CoV-Spectrum',
                href: 'https://cov-spectrum.org',
                underlineColor: organism.primaryColor,
            });
        }
        return {
            headline: organism.label,
            headlineBackgroundColor: organism.primaryColor,
            navigationEntries: megaMenuSections,
        };
    });

    return (
        <nav className=''>
            <ul className='flex space-x-8'>
                <li className='group'>
                    <NavigationEntry
                        href='#'
                        label='Pathogens'
                        className='group-hover:border-b-2 group-hover:border-black group-hover:text-black'
                    />
                    <MegaMenu className='hidden group-hover:block'>
                        {pathogenMegaMenuSections.map((section) => (
                            <MegaMenuSection {...section}>
                                {section.navigationEntries.map((entry) => (
                                    <MegaMenuListEntry {...entry} />
                                ))}
                            </MegaMenuSection>
                        ))}
                    </MegaMenu>
                </li>
                <li className='h-full'>
                    <NavigationEntry href='/data' label='Data sources' />
                </li>
            </ul>
        </nav>
    );
}

export type NavigationEntryProps = {
    href: string;
    label: string;
};

export function NavigationEntry({ href, label, className }: WithClassName<NavigationEntryProps>) {
    return (
        <a href={href}>
            <div
                className={`flex h-${headerHeight} items-center text-gray-500 transition-all hover:text-black ${className}`}
            >
                {label}
            </div>
        </a>
    );
}
