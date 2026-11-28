import { and, bool, field, str, type Expr } from '../transport/expression.ts';

export const COLUMNS = {
    accessionVersion: 'accessionVersion',
    dataUseTerms: 'dataUseTerms',
    restrictedUntil: 'dataUseTermsRestrictedUntil',
    termsUrl: 'dataUseTermsUrl',
    country: 'geoLocCountry',
    admin1: 'geoLocAdmin1',
    lower: 'sampleCollectionDateRangeLower',
    upper: 'sampleCollectionDateRangeUpper',
    host: 'hostNameScientific',
    hostTaxon: 'hostTaxonId',
    group: 'groupId',
    groupName: 'groupName',
    authors: 'authors',
    affiliations: 'authorAffiliations',
    versionStatus: 'versionStatus',
    revocation: 'isRevocation',
} as const;

/** Include current versions only, excluding revocations. */
export const CURRENT_VERSION: Expr = and(
    field(COLUMNS.versionStatus).eq(str('LATEST_VERSION')),
    field(COLUMNS.revocation).eq(bool(false)),
);

export type ColumnCheck = (table: string, column: string) => boolean;
