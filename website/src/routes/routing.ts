import { type Route, type View } from './View.ts';
import { CovidAnalyzeSingleVariantView, CovidCompareVariantsView, CovidSequencingEffortsView } from './covid.ts';
import { H5n1AnalyzeSingleVariantView, H5n1SequencingEffortsView } from './h5n1.ts';
import { MpoxAnalyzeSingleVariantView, MpoxSequencingEffortsView } from './mpox.ts';
import { RsvAAnalyzeSingleVariantView, RsvASequencingEffortsView } from './rsvA.ts';
import { RsvBAnalyzeSingleVariantView, RsvBSequencingEffortsView } from './rsvB.ts';
import type { OrganismsConfig } from '../config.ts';
import { WestNileAnalyzeSingleVariantView, WestNileSequencingEffortsView } from './westNile.ts';
import { Organisms } from '../types/Organism.ts';
import type { InstanceLogger } from '../types/logMessage.ts';

export class Routing {
    public readonly views;

    private readonly allViews;

    constructor(organismsConfig: OrganismsConfig, loggerProvider: (instance: string) => InstanceLogger) {
        this.views = {
            [Organisms.covid]: [
                new CovidAnalyzeSingleVariantView(organismsConfig),
                new CovidCompareVariantsView(organismsConfig, loggerProvider('CovidCompareVariantsView')),
                new CovidSequencingEffortsView(organismsConfig),
            ],
            [Organisms.h5n1]: [
                new H5n1AnalyzeSingleVariantView(organismsConfig),
                new H5n1SequencingEffortsView(organismsConfig),
            ],
            [Organisms.mpox]: [
                new MpoxAnalyzeSingleVariantView(organismsConfig),
                new MpoxSequencingEffortsView(organismsConfig),
            ],
            [Organisms.rsvA]: [
                new RsvAAnalyzeSingleVariantView(organismsConfig),
                new RsvASequencingEffortsView(organismsConfig),
            ],
            [Organisms.rsvB]: [
                new RsvBAnalyzeSingleVariantView(organismsConfig),
                new RsvBSequencingEffortsView(organismsConfig),
            ],
            [Organisms.westNile]: [
                new WestNileAnalyzeSingleVariantView(organismsConfig),
                new WestNileSequencingEffortsView(organismsConfig),
            ],
        } as const;
        this.allViews = Object.values(this.views).flat();
    }

    public get covidAnalyzeSingleVariantView() {
        return this.views.covid[0];
    }

    public get covidCompareVariantsView() {
        return this.views.covid[1];
    }

    public getCurrentRouteInBrowser = () => {
        return this.parseUrl(new URL(window.location.href));
    };

    public parseUrl = (url: URL) => {
        for (const view of this.allViews) {
            if (view.pathname === url.pathname) {
                const route = view.parseUrl(url)! as Route;
                return { view: view as unknown as View<Route>, route };
            }
        }
        return undefined;
    };
}
