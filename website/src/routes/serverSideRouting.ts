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
    covidAnalyzeSingleVariantView: routing.getOrganismView("covid.singleVariantView"),
    covidCompareVariantsView: routing.getOrganismView("covid.compareVariantsView"),
    covidSequencingEffortsView: routing.getOrganismView("covid.sequencingEffortsView"),
    h5n1AnalyzeSingleVariantView: routing.getOrganismView("h5n1.singleVariantView"),
    h5n1SequencingEffortsView: routing.getOrganismView("h5n1.sequencingEffortsView"),
    mpoxAnalyzeSingleVariantView: routing.getOrganismView("mpox.singleVariantView"),
    mpoxSequencingEffortsView: routing.getOrganismView("mpox.sequencingEffortsView"),
    rsvAAnalyzeSingleVariantView: routing.getOrganismView("rsvA.singleVariantView"),
    rsvASequencingEffortsView: routing.getOrganismView("rsvA.sequencingEffortsView"),
    rsvBAnalyzeSingleVariantView: routing.getOrganismView("rsvB.singleVariantView"),
    rsvBSequencingEffortsView: routing.getOrganismView("rsvB.sequencingEffortsView"),
    westNileAnalyzeSingleVariantView: routing.getOrganismView("westNile.singleVariantView"),
    westNileSequencingEffortsView: routing.getOrganismView("westNile.sequencingEffortsView"),
};
