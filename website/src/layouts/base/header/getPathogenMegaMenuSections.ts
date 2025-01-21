import { organismConfig } from '../../../types/Organism.ts';
import { ServerSide } from '../../../views/serverSideRouting.ts';

export const wastewaterConfig = {
    pathFragment: 'swiss-wastewater',
    menuListEntryDecoration: 'decoration-amber-600',
};

export function getPathogenMegaMenuSections() {
    const sections = Object.values(organismConfig).map((organism) => {
        const megaMenuSections = ServerSide.routing.getAllViewsForOrganism(organism.organism).map((view) => {
            const href = view.pageStateHandler.getDefaultPageUrl();
            return {
                label: view.viewConstants.labelLong,
                href,
                underlineColor: organism.menuListEntryDecoration,
                iconType: view.viewConstants.iconType,
                externalLink: false,
            };
        });

        megaMenuSections.push(
            ...ServerSide.routing.externalPages[organism.organism].map((externalPage) => ({
                label: externalPage.label,
                href: externalPage.url,
                underlineColor: organism.menuListEntryDecoration,
                iconType: externalPage.menuIcon,
                externalLink: true,
            })),
        );

        return {
            headline: organism.label,
            headlineBackgroundColor: organism.backgroundColor,
            headlineBackgroundColorFocus: organism.backgroundColorFocus,
            borderEntryDecoration: organism.borderEntryDecoration,
            navigationEntries: megaMenuSections,
        };
    });

    sections.push({
        headline: 'Swiss Wastewater',
        headlineBackgroundColor: 'bg-[#fbb05b]',
        headlineBackgroundColorFocus: 'group-hover:bg-amber-600',
        borderEntryDecoration: 'hover:border-amber-600',
        navigationEntries: [
            {
                label: 'RSV',
                iconType: 'table',
                href: `/${wastewaterConfig.pathFragment}/rsv`,
                underlineColor: wastewaterConfig.menuListEntryDecoration,
                externalLink: false,
            },
            {
                label: 'Influenza',
                iconType: 'table',
                href: `/${wastewaterConfig.pathFragment}/influenza`,
                underlineColor: wastewaterConfig.menuListEntryDecoration,
                externalLink: false,
            },
            {
                label: 'Browse data',
                iconType: 'database',
                href: 'https://wise-loculus.genspectrum.org',
                underlineColor: wastewaterConfig.menuListEntryDecoration,
                externalLink: true,
            },
        ],
    });

    return sections;
}
