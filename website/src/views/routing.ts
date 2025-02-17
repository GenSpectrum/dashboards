import type { OrganismConstants } from './OrganismConstants.ts';
import type { View } from './View.ts';
import {
    CovidAnalyzeSingleVariantView,
    CovidCompareSideBySideView,
    CovidCompareToBaselineView,
    CovidCompareVariantsView,
    CovidSequencingEffortsView,
} from './covid.ts';
import {
    EbolaZaireAnalyzeSingleVariantView,
    EbolaZaireCompareSideBySideView,
    EbolaZaireCompareToBaselineView,
    EbolaZaireCompareVariantsView,
    EbolaZaireSequencingEffortsView,
} from './ebolaZaire.ts';
import { FluCompareSideBySideView, FluSequencingEffortsView } from './flu.ts';
import {
    H5n1AnalyzeSingleVariantView,
    H5n1CompareSideBySideView,
    H5n1CompareToBaselineView,
    H5n1CompareVariantsView,
    H5n1SequencingEffortsView,
} from './h5n1.ts';
import {
    MpoxAnalyzeSingleVariantView,
    MpoxCompareSideBySideView,
    MpoxCompareToBaselineView,
    MpoxCompareVariantsView,
    MpoxSequencingEffortsView,
} from './mpox.ts';
import type { PageStateHandler } from './pageStateHandlers/PageStateHandler.ts';
import {
    RsvAAnalyzeSingleVariantView,
    RsvACompareSideBySideView,
    RsvACompareToBaselineView,
    RsvACompareVariantsView,
    RsvASequencingEffortsView,
} from './rsvA.ts';
import {
    RsvBAnalyzeSingleVariantView,
    RsvBCompareSideBySideView,
    RsvBCompareToBaselineView,
    RsvBCompareVariantsView,
    RsvBSequencingEffortsView,
} from './rsvB.ts';
import type { ExternalNavigationLink, OrganismsConfig } from '../config.ts';
import {
    compareSideBySideViewKey,
    compareToBaselineViewKey,
    compareVariantsViewKey,
    sequencingEffortsViewKey,
    singleVariantViewKey,
} from './viewKeys.ts';
import {
    WestNileAnalyzeSingleVariantView,
    WestNileCompareSideBySideView,
    WestNileCompareToBaselineView,
    WestNileCompareVariantsView,
    WestNileSequencingEffortsView,
} from './westNile.ts';
import { type Organism, Organisms } from '../types/Organism.ts';

type ViewsMap = typeof Routing.prototype.views;

const keySeparator = '.';
type KeySeparator = typeof keySeparator;

type ViewKey<Organism extends keyof ViewsMap> = Extract<keyof ViewsMap[Organism], string>;

export type OrganismViewKey = {
    [Organism in keyof ViewsMap]: {
        [Key in ViewKey<Organism>]: `${Organism}${KeySeparator}${Key}`;
    }[ViewKey<Organism>];
}[keyof ViewsMap];

type OrganismExtractor<T, ViewKey extends string> = T extends `${infer O}.${ViewKey}` ? O : never;
export type OrganismWithViewKey<ViewKey extends string> = OrganismExtractor<OrganismViewKey, ViewKey>;

export class Routing {
    public readonly views;
    public readonly externalPages;

    constructor(organismsConfig: OrganismsConfig) {
        this.views = {
            [Organisms.covid]: {
                [sequencingEffortsViewKey]: new CovidSequencingEffortsView(organismsConfig),
                [singleVariantViewKey]: new CovidAnalyzeSingleVariantView(organismsConfig),
                [compareVariantsViewKey]: new CovidCompareVariantsView(organismsConfig),
                [compareToBaselineViewKey]: new CovidCompareToBaselineView(organismsConfig),
                [compareSideBySideViewKey]: new CovidCompareSideBySideView(organismsConfig),
            },
            [Organisms.h5n1]: {
                [sequencingEffortsViewKey]: new H5n1SequencingEffortsView(organismsConfig),
                [singleVariantViewKey]: new H5n1AnalyzeSingleVariantView(organismsConfig),
                [compareVariantsViewKey]: new H5n1CompareVariantsView(organismsConfig),
                [compareToBaselineViewKey]: new H5n1CompareToBaselineView(organismsConfig),
                [compareSideBySideViewKey]: new H5n1CompareSideBySideView(organismsConfig),
            },
            [Organisms.flu]: {
                [sequencingEffortsViewKey]: new FluSequencingEffortsView(organismsConfig),
                [compareSideBySideViewKey]: new FluCompareSideBySideView(organismsConfig),
            },
            [Organisms.rsvA]: {
                [sequencingEffortsViewKey]: new RsvASequencingEffortsView(organismsConfig),
                [singleVariantViewKey]: new RsvAAnalyzeSingleVariantView(organismsConfig),
                [compareVariantsViewKey]: new RsvACompareVariantsView(organismsConfig),
                [compareToBaselineViewKey]: new RsvACompareToBaselineView(organismsConfig),
                [compareSideBySideViewKey]: new RsvACompareSideBySideView(organismsConfig),
            },
            [Organisms.rsvB]: {
                [sequencingEffortsViewKey]: new RsvBSequencingEffortsView(organismsConfig),
                [singleVariantViewKey]: new RsvBAnalyzeSingleVariantView(organismsConfig),
                [compareVariantsViewKey]: new RsvBCompareVariantsView(organismsConfig),
                [compareToBaselineViewKey]: new RsvBCompareToBaselineView(organismsConfig),
                [compareSideBySideViewKey]: new RsvBCompareSideBySideView(organismsConfig),
            },
            [Organisms.westNile]: {
                [sequencingEffortsViewKey]: new WestNileSequencingEffortsView(organismsConfig),
                [singleVariantViewKey]: new WestNileAnalyzeSingleVariantView(organismsConfig),
                [compareVariantsViewKey]: new WestNileCompareVariantsView(organismsConfig),
                [compareToBaselineViewKey]: new WestNileCompareToBaselineView(organismsConfig),
                [compareSideBySideViewKey]: new WestNileCompareSideBySideView(organismsConfig),
            },
            [Organisms.mpox]: {
                [sequencingEffortsViewKey]: new MpoxSequencingEffortsView(organismsConfig),
                [singleVariantViewKey]: new MpoxAnalyzeSingleVariantView(organismsConfig),
                [compareVariantsViewKey]: new MpoxCompareVariantsView(organismsConfig),
                [compareToBaselineViewKey]: new MpoxCompareToBaselineView(organismsConfig),
                [compareSideBySideViewKey]: new MpoxCompareSideBySideView(organismsConfig),
            },
            [Organisms.ebolaZaire]: {
                [sequencingEffortsViewKey]: new EbolaZaireSequencingEffortsView(organismsConfig),
                [singleVariantViewKey]: new EbolaZaireAnalyzeSingleVariantView(organismsConfig),
                [compareVariantsViewKey]: new EbolaZaireCompareVariantsView(organismsConfig),
                [compareToBaselineViewKey]: new EbolaZaireCompareToBaselineView(organismsConfig),
                [compareSideBySideViewKey]: new EbolaZaireCompareSideBySideView(organismsConfig),
            },
        } as const;

        this.externalPages = this.initializeExternalPages(organismsConfig);
    }

    public getAllViewsForOrganism(organism: keyof ViewsMap) {
        switch (organism) {
            case Organisms.covid:
                return Object.values(this.views[Organisms.covid]);
            case Organisms.h5n1:
                return Object.values(this.views[Organisms.h5n1]);
            case Organisms.flu:
                return Object.values(this.views[Organisms.flu]);
            case Organisms.rsvA:
                return Object.values(this.views[Organisms.rsvA]);
            case Organisms.rsvB:
                return Object.values(this.views[Organisms.rsvB]);
            case Organisms.westNile:
                return Object.values(this.views[Organisms.westNile]);
            case Organisms.mpox:
                return Object.values(this.views[Organisms.mpox]);
            case Organisms.ebolaZaire:
                return Object.values(this.views[Organisms.ebolaZaire]);
        }
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

    public isOrganismWithViewKey<ViewKey extends string>(
        organism: Organism,
        key: ViewKey,
    ): organism is OrganismWithViewKey<ViewKey> {
        return key in this.views[organism];
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
