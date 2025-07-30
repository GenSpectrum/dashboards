import { describe, expect, it } from 'vitest';

import { Organisms } from '../../types/Organism.ts';
import type { OrganismConstants } from '../OrganismConstants.ts';
import type { CompareToBaselineData } from '../View.ts';
import { CompareToBaselineStateHandler } from './CompareToBaselinePageStateHandler.ts';

const mockDateRangeOption = { label: 'Last 7 Days', dateFrom: '2024-11-22', dateTo: '2024-11-29' };

const mockConstants: OrganismConstants = {
    organism: Organisms.covid,
    dataOrigins: [],
    locationFields: ['country', 'region'],
    mainDateField: 'date',
    additionalFilters: undefined,
    lineageFilters: [
        {
            lapisField: 'lineage',
            placeholderText: 'Lineage',
            filterType: 'text',
        },
    ],
    aggregatedVisualizations: {
        sequencingEfforts: [],
        singleVariant: [],
        compareSideBySide: [],
    },
    accessionDownloadFields: [],
    useVariantQuery: true,
    baselineFilterConfigs: [
        {
            type: 'text',
            lapisField: 'someTextField',
            placeholderText: 'Some text field',
            label: 'Some text field',
        },
        {
            type: 'date',
            dateRangeOptions: () => [mockDateRangeOption],
            dateColumn: 'date',
        },
        {
            type: 'location',
            placeholderText: 'Some location',
            label: 'Some location',
            locationFields: ['country', 'region'],
        },
    ],
};

const mockDefaultPageState: CompareToBaselineData = {
    variants: new Map(),
    datasetFilter: {
        locationFilters: {},
        dateFilters: { date: mockDateRangeOption },
        textFilters: {},
        numberFilters: {},
    },
    baselineFilter: {
        lineages: {},
        mutations: {},
    },
};

describe('CompareToBaselinePageStateHandler', () => {
    const handler = new CompareToBaselineStateHandler(mockConstants, mockDefaultPageState);

    it('should return the default page URL', () => {
        const url = handler.getDefaultPageUrl();
        expect(url).toBe('/covid/compare-to-baseline?date=Last+7+Days&');
    });

    it('should parse page state from URL, including variants', () => {
        const url = new URL(
            'http://example.com/covid/compare-to-baseline?' +
                'columns=3' +
                '&country=US&date=Last 7 Days&advancedQuery=country%3DUS' +
                '&lineage=B.2.3.4&nucleotideMutations=C234G&advancedQueryVariant=123T' +
                '&lineage$0=B.1.1.7&nucleotideMutations$0=D614G' +
                '&lineage$1=A.1.2.3&aminoAcidMutations$1=S:A123T&advancedQueryVariant$1=345G' +
                '&variantQuery$2=A123T' +
                '&',
        );

        const pageState = handler.parsePageStateFromUrl(url);

        expect(pageState.datasetFilter).toEqual({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            locationFilters: { 'country,region': { country: 'US' } },
            dateFilters: { date: mockDateRangeOption },
            advancedQuery: 'country=US',
            numberFilters: {},
            textFilters: {},
        });

        expect(pageState.baselineFilter).toEqual({
            lineages: { lineage: 'B.2.3.4' },
            mutations: {
                nucleotideMutations: ['C234G'],
            },
            advancedQuery: '123T',
        });

        expect(pageState.variants.size).toBe(3);
        expect(pageState.variants.get(0)).toEqual({
            lineages: { lineage: 'B.1.1.7' },
            mutations: { nucleotideMutations: ['D614G'] },
        });
        expect(pageState.variants.get(1)).toEqual({
            lineages: { lineage: 'A.1.2.3' },
            mutations: { aminoAcidMutations: ['S:A123T'] },
            advancedQuery: '345G',
        });
        expect(pageState.variants.get(2)).toEqual({
            variantQuery: 'A123T',
        });
    });

    it('should convert page state to URL', () => {
        const pageState: CompareToBaselineData = {
            variants: new Map([
                [
                    0,
                    {
                        lineages: { lineage: 'B.1.1.7' },
                        mutations: { nucleotideMutations: ['D614G'] },
                    },
                ],
                [
                    1,
                    {
                        lineages: { lineage: 'A.1.2.3' },
                        mutations: { aminoAcidMutations: ['S:A123T'] },
                        advancedQuery: '345G',
                    },
                ],
                [
                    2,
                    {
                        variantQuery: 'C234G',
                    },
                ],
            ]),
            datasetFilter: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                locationFilters: { 'country,region': { country: 'US' } },
                dateFilters: { date: mockDateRangeOption },
                textFilters: {},
                numberFilters: {},
                advancedQuery: 'country=US',
            },
            baselineFilter: {
                lineages: {
                    lineage: 'B.2.3.4',
                },
                mutations: {
                    nucleotideMutations: ['C234G'],
                },
                advancedQuery: '123T',
            },
        };
        const url = handler.toUrl(pageState);
        expect(url).toBe(
            '/covid/compare-to-baseline?' +
                'columns=3' +
                '&nucleotideMutations%240=D614G&lineage%240=B.1.1.7' +
                '&aminoAcidMutations%241=S%3AA123T&lineage%241=A.1.2.3&advancedQueryVariant%241=345G' +
                '&variantQuery%242=C234G' +
                '&country=US&date=Last+7+Days&advancedQuery=country%3DUS' +
                '&nucleotideMutations=C234G&lineage=B.2.3.4&advancedQueryVariant=123T' +
                '&',
        );
    });

    it('should ignore date filters that are null when converting page state to URL', () => {
        const pageState: CompareToBaselineData = {
            variants: new Map(),
            datasetFilter: {
                locationFilters: {},
                dateFilters: { date: null },
                textFilters: {},
                numberFilters: {},
            },
            baselineFilter: {},
        };

        const url = handler.toUrl(pageState);

        expect(url).toBe('/covid/compare-to-baseline');
    });

    it('should convert page state with deleted id to URL', () => {
        const pageState: CompareToBaselineData = {
            variants: new Map([
                [
                    0,
                    {
                        lineages: { lineage: 'B.1.1.7' },
                        mutations: { nucleotideMutations: ['D614G'] },
                    },
                ],
                [
                    2,
                    {
                        variantQuery: 'C234G',
                    },
                ],
            ]),
            datasetFilter: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                locationFilters: { 'country,region': { country: 'US' } },
                dateFilters: { date: mockDateRangeOption },
                textFilters: {},
                numberFilters: {},
            },
            baselineFilter: {
                lineages: {
                    lineage: 'B.2.3.4',
                },
                mutations: {
                    nucleotideMutations: ['C234G'],
                },
            },
        };
        const url = handler.toUrl(pageState);
        expect(url).toBe(
            '/covid/compare-to-baseline?' +
                'columns=2' +
                '&nucleotideMutations%240=D614G&lineage%240=B.1.1.7' +
                '&variantQuery%241=C234G' +
                '&country=US&date=Last+7+Days' +
                '&nucleotideMutations=C234G&lineage=B.2.3.4' +
                '&',
        );
    });

    it('should convert dataset filter to Lapis filter', () => {
        const lapisFilter = handler.datasetFilterToLapisFilter({
            ...mockDefaultPageState.datasetFilter,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            locationFilters: { 'country,region': { country: 'US' } },
        });
        expect(lapisFilter).toStrictEqual({
            dateFrom: '2024-11-22',
            dateTo: '2024-11-29',
            country: 'US',
        });
    });

    it('should convert the page state to a named variant filter', () => {
        const pageState: CompareToBaselineData = {
            ...mockDefaultPageState,
            variants: new Map([
                [
                    1,
                    {
                        lineages: { lineage: 'B.1.1.7' },
                        mutations: { nucleotideMutations: ['D614G'], aminoAcidMutations: ['S:A123T'] },
                        advancedQuery: '123T',
                    },
                ],
            ]),
        };
        const namedVariantFilter = handler.variantFiltersToNamedLapisFilters(pageState);
        expect(namedVariantFilter).deep.equal([
            {
                displayName: 'B.1.1.7 + D614G + S:A123T + 123T',
                lapisFilter: {
                    advancedQuery: '123T',
                    aminoAcidMutations: ['S:A123T'],
                    dateFrom: '2024-11-22',
                    dateTo: '2024-11-29',
                    lineage: 'B.1.1.7',
                    nucleotideMutations: ['D614G'],
                },
            },
        ]);
    });

    it('should convert the page state to a baseline lapis filter', () => {
        const pageState: CompareToBaselineData = {
            ...mockDefaultPageState,
            baselineFilter: {
                lineages: { lineage: 'B.1.1.7' },
                mutations: { nucleotideMutations: ['D614G'] },
                advancedQuery: '123T',
            },
        };

        const baselineLapisFilter = handler.baselineFilterToLapisFilter(pageState);

        expect(baselineLapisFilter).toStrictEqual({
            advancedQuery: '123T',
            dateFrom: '2024-11-22',
            dateTo: '2024-11-29',
            lineage: 'B.1.1.7',
            nucleotideMutations: ['D614G'],
        });
    });
});
