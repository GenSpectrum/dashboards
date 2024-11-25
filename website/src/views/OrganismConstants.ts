import type { DateRangeOption } from '@genspectrum/dashboard-components/util';

import type { LineageFilterConfig } from '../components/pageStateSelectors/VariantSelector.tsx';
import type { Organism } from '../types/Organism.ts';
import type { DataOrigin } from '../types/dataOrigins.ts';

export interface OrganismConstants {
    readonly organism: Organism;
    readonly dataOrigins: DataOrigin[];
}

export interface SequencingEffortsConstants extends OrganismConstants {
    readonly locationFields: string[];
    readonly mainDateField: string;
    readonly dateRangeOptions: DateRangeOption[];
    readonly defaultDateRange: DateRangeOption;
    readonly additionalFilters: Record<string, string> | undefined;
}

export interface SingleVariantConstants extends SequencingEffortsConstants {
    readonly lineageFilters: LineageFilterConfig[];
}
