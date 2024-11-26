import { type DateRangeOption, dateRangeOptionPresets } from '@genspectrum/dashboard-components/util';

import { GenericSequencingEffortsView, GenericSingleVariantView } from './View.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/VariantSelector.tsx';
import type { OrganismsConfig } from '../config.ts';
import type { SingleVariantConstants } from './OrganismConstants.ts';
import { Organisms } from '../types/Organism.ts';
import type { DataOrigin } from '../types/dataOrigins.ts';

class RsvAConstants implements SingleVariantConstants {
    public readonly organism = Organisms.rsvA;
    public readonly defaultDateRange = dateRangeOptionPresets.lastYear;
    public readonly earliestDate = '1956-01-01';
    public readonly dateRangeOptions: DateRangeOption[] = [
        dateRangeOptionPresets.lastMonth,
        dateRangeOptionPresets.last2Months,
        dateRangeOptionPresets.last3Months,
        dateRangeOptionPresets.last6Months,
        dateRangeOptionPresets.lastYear,
        { label: 'Since 2020', dateFrom: '2020-01-01' },
        { label: '2010-2019', dateFrom: '2010-01-01', dateTo: '2019-12-31' },
        { label: '2000-2009', dateFrom: '2000-01-01', dateTo: '2009-12-31' },
        { label: 'Since 2000', dateFrom: '2000-01-01' },
        { label: 'Before 2000', dateFrom: this.earliestDate, dateTo: '1999-12-31' },
        { label: 'All times', dateFrom: this.earliestDate },
    ];
    public readonly mainDateField: string;
    public readonly locationFields: string[];
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: 'lineage',
            placeholderText: 'Lineage',
            filterType: 'text' as const,
            initialValue: undefined,
        },
    ];
    public readonly hostField: string;
    public readonly authorsField: string | undefined;
    public readonly authorAffiliationsField: string | undefined;
    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = ['insdc'];

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.rsvA.lapis.mainDateField;
        this.locationFields = organismsConfig.rsvA.lapis.locationFields;
        this.hostField = organismsConfig.rsvA.lapis.hostField;
        this.authorsField = organismsConfig.rsvA.lapis.authorsField;
        this.authorAffiliationsField = organismsConfig.rsvA.lapis.authorAffiliationsField;
        this.additionalFilters = organismsConfig.rsvA.lapis.additionalFilters;
    }
}

export class RsvAAnalyzeSingleVariantView extends GenericSingleVariantView<RsvAConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new RsvAConstants(organismsConfig));
    }
}

export class RsvASequencingEffortsView extends GenericSequencingEffortsView<RsvAConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new RsvAConstants(organismsConfig));
    }
}
