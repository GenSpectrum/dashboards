import type { MenuIconType } from '../../../components/iconCss.ts';
import { type Organism, organismConfig, paths } from '../../../types/Organism.ts';
import { wastewaterConfig, wastewaterPathFragment } from '../../../types/wastewaterConfig.ts';
import { ServerSide } from '../../../views/serverSideRouting.ts';

type MegaMenuSection = {
    label: string;
    href: string;
    underlineColor: string;
    iconType: MenuIconType;
    externalLink: boolean;
    description?: string;
};

export type PathogenMegaMenuSection = {
    headline: string;
    headlineBackgroundColor: string;
    headlineBackgroundColorFocus: string;
    borderEntryDecoration: string;
    navigationEntries: MegaMenuSection[];
    href: string;
};

type PathogenMegaMenuSections = {
    [key in Organism | 'swissWastewater']: PathogenMegaMenuSection;
};

export function getPathogenMegaMenuSections(): PathogenMegaMenuSections {
    const sections = Object.values(organismConfig).reduce((acc, config) => {
        const megaMenuSections: MegaMenuSection[] = ServerSide.routing
            .getAllViewsForOrganism(config.organism)
            .map((view) => {
                const href = view.pageStateHandler.getDefaultPageUrl();
                return {
                    label: view.viewConstants.labelLong,
                    href,
                    underlineColor: config.menuListEntryDecoration,
                    iconType: view.viewConstants.iconType,
                    externalLink: false,
                    description: view.viewConstants.description,
                };
            });

        megaMenuSections.push(
            ...ServerSide.routing.externalPages[config.organism].map((externalPage) => ({
                label: externalPage.label,
                href: externalPage.url,
                underlineColor: config.menuListEntryDecoration,
                iconType: externalPage.menuIcon,
                externalLink: true,
            })),
        );

        acc[config.organism] = {
            headline: config.label,
            headlineBackgroundColor: config.backgroundColor,
            headlineBackgroundColorFocus: config.backgroundColorFocus,
            borderEntryDecoration: config.borderEntryDecoration,
            navigationEntries: megaMenuSections,
            href: paths[config.organism].basePath,
        };
        return acc;
    }, {} as PathogenMegaMenuSections);

    sections.swissWastewater = {
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
        href: `/${wastewaterPathFragment}`,
    };

    return sections;
}
