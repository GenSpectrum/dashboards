import type { OrganismConstants } from './OrganismConstants.ts';
import type { PageStateHandler } from './PageStateHandler.ts';
import type { View } from './View.ts';
import { CovidAnalyzeSingleVariantView, CovidCompareSideBySideView, CovidSequencingEffortsView } from './covid.ts';
import { H5n1AnalyzeSingleVariantView, H5n1CompareSideBySideView, H5n1SequencingEffortsView } from './h5n1.ts';
import { RsvAAnalyzeSingleVariantView, RsvACompareSideBySideView, RsvASequencingEffortsView } from './rsvA.ts';
import { RsvBAnalyzeSingleVariantView, RsvBCompareSideBySideView, RsvBSequencingEffortsView } from './rsvB.ts';
import type { ExternalNavigationLink, OrganismsConfig } from '../config.ts';
import {
    WestNileAnalyzeSingleVariantView,
    WestNileCompareSideBySideView,
    WestNileSequencingEffortsView,
} from './westNile.ts';
import { type Organism, Organisms } from '../types/Organism.ts';

export const singleVariantViewKey = 'singleVariantView';
export const compareSideBySideViewKey = 'compareSideBySideView';
export const sequencingEffortsViewKey = 'sequencingEffortsView';

type ViewsMap = typeof Routing.prototype.views;

const keySeparator = '.';
type KeySeparator = typeof keySeparator;

type ViewKey<Organism extends keyof ViewsMap> = Extract<keyof ViewsMap[Organism], string>;

export type OrganismViewKey = {
    [Organism in keyof ViewsMap]: {
        [Key in ViewKey<Organism>]: `${Organism}${KeySeparator}${Key}`;
    }[ViewKey<Organism>];
}[keyof ViewsMap];

export class Routing {
    public readonly views;
    public readonly externalPages;

    constructor(organismsConfig: OrganismsConfig) {
        this.views = {
            [Organisms.covid]: {
                [singleVariantViewKey]: new CovidAnalyzeSingleVariantView(organismsConfig),
                [compareSideBySideViewKey]: new CovidCompareSideBySideView(organismsConfig),
                [sequencingEffortsViewKey]: new CovidSequencingEffortsView(organismsConfig),
            },
            [Organisms.h5n1]: {
                [singleVariantViewKey]: new H5n1AnalyzeSingleVariantView(organismsConfig),
                [compareSideBySideViewKey]: new H5n1CompareSideBySideView(organismsConfig),
                [sequencingEffortsViewKey]: new H5n1SequencingEffortsView(organismsConfig),
            },
            [Organisms.rsvA]: {
                [singleVariantViewKey]: new RsvAAnalyzeSingleVariantView(organismsConfig),
                [compareSideBySideViewKey]: new RsvACompareSideBySideView(organismsConfig),
                [sequencingEffortsViewKey]: new RsvASequencingEffortsView(organismsConfig),
            },
            [Organisms.rsvB]: {
                [singleVariantViewKey]: new RsvBAnalyzeSingleVariantView(organismsConfig),
                [compareSideBySideViewKey]: new RsvBCompareSideBySideView(organismsConfig),
                [sequencingEffortsViewKey]: new RsvBSequencingEffortsView(organismsConfig),
            },
            [Organisms.westNile]: {
                [singleVariantViewKey]: new WestNileAnalyzeSingleVariantView(organismsConfig),
                [compareSideBySideViewKey]: new WestNileCompareSideBySideView(organismsConfig),
                [sequencingEffortsViewKey]: new WestNileSequencingEffortsView(organismsConfig),
            },
        } as const;

        this.externalPages = this.initializeExternalPages(organismsConfig);
    }

    public getOrganismView<Organism extends keyof ViewsMap, Key extends ViewKey<Organism>>(
        key: `${Organism}${KeySeparator}${Key}`,
    ): ViewsMap[Organism][Key];

    public getOrganismView(key: OrganismViewKey): View<object, OrganismConstants, PageStateHandler<object>>;

    public getOrganismView<Organism extends keyof ViewsMap, Key extends ViewKey<Organism>>(
        key: `${Organism}${KeySeparator}${Key}`,
    ): ViewsMap[Organism][Key] {
        const [organism, viewKey] = key.split(keySeparator) as [Organism, Key];
        return this.views[organism][viewKey];
    }

    private initializeExternalPages(organismsConfig: OrganismsConfig) {
        return Object.entries(organismsConfig).reduce(
            (acc, [organism, config]) => {
                acc[organism as Organism] = config.externalNavigationLinks ?? [];
                return acc;
            },
            {} as { [organism in Organism]: ExternalNavigationLink[] },
        );
    }
}
