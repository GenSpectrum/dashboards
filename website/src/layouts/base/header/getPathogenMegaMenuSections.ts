import { organismConfig } from '../../../types/Organism.ts';
import { wastewaterConfig } from '../../../types/wastewaterConfig.ts';
import { ServerSide } from '../../../views/serverSideRouting.ts';

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
        headlineBackgroundColor: wastewaterConfig.backgroundColor,
        headlineBackgroundColorFocus: wastewaterConfig.backgroundColorFocus,
        borderEntryDecoration: wastewaterConfig.borderEntryDecoration,
        navigationEntries: [
            {
                label: 'RSV',
                iconType: 'table',
                href: wastewaterConfig.pages.rsv,
                underlineColor: wastewaterConfig.menuListEntryDecoration,
                externalLink: false,
            },
            {
                label: 'Influenza',
                iconType: 'table',
                href: wastewaterConfig.pages.influenza,
                underlineColor: wastewaterConfig.menuListEntryDecoration,
                externalLink: false,
            },
            {
                label: 'Browse data',
                iconType: 'database',
                href: wastewaterConfig.browseDataUrl,
                underlineColor: wastewaterConfig.menuListEntryDecoration,
                externalLink: true,
            },
        ],
    });

    return sections;
}
