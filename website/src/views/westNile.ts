import { type DateRangeOption, dateRangeOptionPresets } from '@genspectrum/dashboard-components/util';

import { GenericSequencingEffortsView, GenericSingleVariantView } from './View.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/VariantSelector.tsx';
import { type OrganismsConfig } from '../config.ts';
import type { SingleVariantConstants } from './OrganismConstants.ts';
import { Organisms } from '../types/Organism.ts';
import type { DataOrigin } from '../types/dataOrigins.ts';

class WestNileConstants implements SingleVariantConstants {
    public readonly organism = Organisms.westNile;
    public readonly earliestDate = '1930-01-01';
    public readonly defaultDateRange = dateRangeOptionPresets.lastYear;
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
    public readonly additionalSequencingEffortsFields = [
        { label: 'Collection device', fieldName: 'collectionDevice' },
        { label: 'Collection method', fieldName: 'collectionMethod' },
        { label: 'Purpose of sampling', fieldName: 'purposeOfSampling' },
        { label: 'Sample type', fieldName: 'sampleType' },
        { label: 'Amplicon PCR primer scheme', fieldName: 'ampliconPcrPrimerScheme' },
        { label: 'Sequencing protocol', fieldName: 'sequencingProtocol' },
    ];
    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = ['pathoplexus'];

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.westNile.lapis.mainDateField;
        this.locationFields = organismsConfig.westNile.lapis.locationFields;
        this.hostField = organismsConfig.westNile.lapis.hostField;
        this.authorsField = organismsConfig.westNile.lapis.authorsField;
        this.authorAffiliationsField = organismsConfig.westNile.lapis.authorAffiliationsField;
        this.additionalFilters = organismsConfig.westNile.lapis.additionalFilters;
    }
}

export class WestNileAnalyzeSingleVariantView extends GenericSingleVariantView<WestNileConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new WestNileConstants(organismsConfig));
    }
}

export class WestNileSequencingEffortsView extends GenericSequencingEffortsView<WestNileConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new WestNileConstants(organismsConfig));
    }
}
