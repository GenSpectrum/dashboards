import { getDashboardsConfig } from '../config.ts';
import { Routing } from './routing.ts';
import { getInstanceLogger } from '../logger.ts';

const organismsConfig = getDashboardsConfig().dashboards.organisms;
const routing = new Routing(organismsConfig, getInstanceLogger);

/**
 * Constants for use in server-side code - for convenience.
 * They cannot be used in client-side code, because they import node modules, which are not available in the browser.
 */
export const ServerSide = {
    routing,
    covidAnalyzeSingleVariantView: routing.covidAnalyzeSingleVariantView,
    covidCompareVariantsView: routing.covidCompareVariantsView,
    covidSequencingEffortsView: routing.views.covid[2],
    h5n1AnalyzeSingleVariantView: routing.views.h5n1[0],
    h5n1SequencingEffortsView: routing.views.h5n1[1],
    mpoxAnalyzeSingleVariantView: routing.views.mpox[0],
    mpoxSequencingEffortsView: routing.views.mpox[1],
    rsvAAnalyzeSingleVariantView: routing.views.rsvA[0],
    rsvASequencingEffortsView: routing.views.rsvA[1],
    rsvBAnalyzeSingleVariantView: routing.views.rsvB[0],
    rsvBSequencingEffortsView: routing.views.rsvB[1],
    westNileAnalyzeSingleVariantView: routing.views.westNile[0],
    westNileSequencingEffortsView: routing.views.westNile[1],
};
