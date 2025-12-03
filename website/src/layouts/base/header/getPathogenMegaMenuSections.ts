import type { MenuIconType } from '../../../components/iconCss.ts';
import { type Organism, organismConfig, paths } from '../../../types/Organism.ts';
import {
    wastewaterConfig,
    wastewaterOrganismConfigs,
    wastewaterPathFragment,
    wastewaterOrganisms,
} from '../../../types/wastewaterConfig.ts';
import { ServerSide } from '../../../views/serverSideRouting.ts';

type MegaMenuSection = {
    label: string;
    href: string;
    underlineColor: string;
    iconType: MenuIconType;
    externalLink: boolean;
    description: string;
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
                description: externalPage.description,
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
                href: wastewaterConfig.pages.rsv.path,
                underlineColor: wastewaterConfig.menuListEntryDecoration,
                externalLink: false,
                description: wastewaterConfig.pages.rsv.description,
            },
            {
                label: 'Influenza',
                iconType: 'table',
                href: wastewaterConfig.pages.influenza.path,
                underlineColor: wastewaterConfig.menuListEntryDecoration,
                externalLink: false,
                description: wastewaterConfig.pages.influenza.description,
            },
            {
                label: 'SARS-CoV-2',
                iconType: 'table',
                href: wastewaterOrganismConfigs[wastewaterOrganisms.covid].path,
                description: wastewaterOrganismConfigs[wastewaterOrganisms.covid].description,
                underlineColor: wastewaterConfig.menuListEntryDecoration,
                externalLink: false,
            },
            {
                label: 'Browse RSV & Influenza data',
                iconType: 'database',
                href: wastewaterConfig.browseDataUrl,
                underlineColor: wastewaterConfig.menuListEntryDecoration,
                externalLink: true,
                description: wastewaterConfig.browseDataDescription,
            },
            {
                label: 'Browse SARS-CoV-2 data',
                iconType: 'database',
                href: wastewaterOrganismConfigs[wastewaterOrganisms.covid].browseDataUrl,
                description: wastewaterOrganismConfigs[wastewaterOrganisms.covid].browseDataDescription,
                underlineColor: wastewaterConfig.menuListEntryDecoration,
                externalLink: true,
            },
        ],
        href: `/${wastewaterPathFragment}`,
    };

    return sections;
}
