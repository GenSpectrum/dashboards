import { getDashboardsConfig } from '../config.ts';
import { Routing } from './routing.ts';

/**
 * Constants for use in server-side code - for convenience.
 * They cannot be used in client-side code, because they import node modules, which are not available in the browser.
 */
export namespace ServerSide {
    const organismsConfig = getDashboardsConfig().dashboards.organisms;

    export const routing = new Routing(organismsConfig);

    export const covidAnalyzeSingleVariantView = routing.views.covid[0];
    export const covidCompareVariantsView = routing.views.covid[1];
    export const covidSequencingEffortsView = routing.views.covid[2];
    export const h5n1AnalyzeSingleVariantView = routing.views.h5n1[0];
    export const h5n1SequencingEffortsView = routing.views.h5n1[1];
    export const mpoxAnalyzeSingleVariantView = routing.views.mpox[0];
    export const mpoxSequencingEffortsView = routing.views.mpox[1];
    export const rsvAAnalyzeSingleVariantView = routing.views.rsvA[0];
    export const rsvASequencingEffortsView = routing.views.rsvA[1];
    export const rsvBAnalyzeSingleVariantView = routing.views.rsvB[0];
    export const rsvBSequencingEffortsView = routing.views.rsvB[1];
    export const westNileAnalyzeSingleVariantView = routing.views.westNile[0];
    export const westNileSequencingEffortsView = routing.views.westNile[1];
}
