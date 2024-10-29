import type { Route, View } from './View.ts';
import { CovidAnalyzeSingleVariantView, CovidCompareVariantsView, CovidSequencingEffortsView } from './covid.ts';
import { H5n1AnalyzeSingleVariantView, H5n1SequencingEffortsView } from './h5n1.ts';
import { MpoxAnalyzeSingleVariantView, MpoxSequencingEffortsView } from './mpox.ts';
import { RsvAAnalyzeSingleVariantView, RsvASequencingEffortsView } from './rsvA.ts';
import { RsvBAnalyzeSingleVariantView, RsvBSequencingEffortsView } from './rsvB.ts';
import type { OrganismsConfig } from '../config.ts';
import { WestNileAnalyzeSingleVariantView, WestNileSequencingEffortsView } from './westNile.ts';
import { Organisms } from '../types/Organism.ts';
import type { InstanceLogger } from '../types/logMessage.ts';

export const singleVariantViewKey = 'singleVariantView';
export const compareVariantsViewKey = 'compareVariantsView';
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

    constructor(organismsConfig: OrganismsConfig, loggerProvider: (instance: string) => InstanceLogger) {
        this.views = {
            [Organisms.covid]: {
                [singleVariantViewKey]: new CovidAnalyzeSingleVariantView(organismsConfig),
                [compareVariantsViewKey]: new CovidCompareVariantsView(
                    organismsConfig,
                    loggerProvider('CovidCompareVariantsView'),
                ),
                [sequencingEffortsViewKey]: new CovidSequencingEffortsView(organismsConfig),
            },
            [Organisms.h5n1]: {
                [singleVariantViewKey]: new H5n1AnalyzeSingleVariantView(organismsConfig),
                [sequencingEffortsViewKey]: new H5n1SequencingEffortsView(organismsConfig),
            },
            [Organisms.mpox]: {
                [singleVariantViewKey]: new MpoxAnalyzeSingleVariantView(organismsConfig),
                [sequencingEffortsViewKey]: new MpoxSequencingEffortsView(organismsConfig),
            },
            [Organisms.rsvA]: {
                [singleVariantViewKey]: new RsvAAnalyzeSingleVariantView(organismsConfig),
                [sequencingEffortsViewKey]: new RsvASequencingEffortsView(organismsConfig),
            },
            [Organisms.rsvB]: {
                [singleVariantViewKey]: new RsvBAnalyzeSingleVariantView(organismsConfig),
                [sequencingEffortsViewKey]: new RsvBSequencingEffortsView(organismsConfig),
            },
            [Organisms.westNile]: {
                [singleVariantViewKey]: new WestNileAnalyzeSingleVariantView(organismsConfig),
                [sequencingEffortsViewKey]: new WestNileSequencingEffortsView(organismsConfig),
            },
        } as const;
    }

    public getOrganismView<Organism extends keyof ViewsMap, Key extends ViewKey<Organism>>(
        key: `${Organism}${KeySeparator}${Key}`,
    ): ViewsMap[Organism][Key];

    public getOrganismView(key: OrganismViewKey): View<Route>;

    public getOrganismView<Organism extends keyof ViewsMap, Key extends ViewKey<Organism>>(
        key: `${Organism}${KeySeparator}${Key}`,
    ): ViewsMap[Organism][Key] {
        const [organism, viewKey] = key.split(keySeparator) as [Organism, Key];
        return this.views[organism][viewKey];
    }
}
