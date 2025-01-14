import { organismConfig } from '../../../types/Organism.ts';
import { ServerSide } from '../../../views/serverSideRouting.ts';

export function getPathogenMegaMenuSections() {
    return Object.values(organismConfig).map((organism) => {
        const megaMenuSections = ServerSide.routing.getAllViewsForOrganism(organism.organism).map((view) => {
            const href = view.pageStateHandler.getDefaultPageUrl();
            return {
                label: view.viewConstants.labelLong,
                href,
                underlineColor: organism.menuListEntryDecoration,
                externalLink: false,
            };
        });

        megaMenuSections.push(
            ...ServerSide.routing.externalPages[organism.organism].map((externalPage) => ({
                label: externalPage.label,
                href: externalPage.url,
                underlineColor: organism.menuListEntryDecoration,
                externalLink: true,
            })),
        );

        return {
            headline: organism.label,
            headlineBackgroundColor: organism.backgroundColor,
            navigationEntries: megaMenuSections,
        };
    });
}
