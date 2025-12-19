import { describe, expect, it } from 'vitest';

import { Organisms } from '../../types/Organism.ts';
import type { OrganismConstants } from '../OrganismConstants.ts';
import type { CompareVariantsData } from '../View.ts';
import { CompareVariantsPageStateHandler } from './CompareVariantsPageStateHandler.ts';

const mockDateRangeOption = { label: 'Last 7 Days', dateFrom: '2024-11-22', dateTo: '2024-11-29' };

const mockConstants: OrganismConstants = {
    organism: Organisms.covid,
    earliestDate: 'earliestDate',
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

const mockDefaultPageState: CompareVariantsData = {
    variants: new Map(),
    datasetFilter: {
        locationFilters: {},
        dateFilters: { date: mockDateRangeOption },
        textFilters: {},
        numberFilters: {},
    },
};

describe('CompareVariantsPageStateHandler', () => {
    const handler = new CompareVariantsPageStateHandler(mockConstants, mockDefaultPageState);

    it('should return the default page URL', () => {
        const url = handler.getDefaultPageUrl();
        expect(url).toBe('/covid/compare-variants?date=Last+7+Days&');
    });

    it('should parse page state from URL, including variants', () => {
        const url = new URL(
            'http://example.com/covid/compareVariants?' +
                'columns=3' +
                '&country=US&date=Last 7 Days&advancedQuery=country%3DUS' +
                '&lineage$0=B.1.1.7&nucleotideMutations$0=D614G' +
                '&lineage$1=A.1.2.3&aminoAcidMutations$1=S:A123T&advancedQueryVariant$1=123T' +
                '&variantQuery$2=C234G' +
                '&',
        );

        const pageState = handler.parsePageStateFromUrl(url);

        expect(pageState.datasetFilter).toEqual({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            locationFilters: { 'country,region': { country: 'US' } },
            dateFilters: { date: mockDateRangeOption },
            numberFilters: {},
            textFilters: {},
            advancedQuery: 'country=US',
        });

        expect(pageState.variants.size).toBe(3);
        expect(pageState.variants.get(0)).toEqual({
            lineages: { lineage: 'B.1.1.7' },
            mutations: { nucleotideMutations: ['D614G'] },
        });
        expect(pageState.variants.get(1)).toEqual({
            lineages: { lineage: 'A.1.2.3' },
            mutations: { aminoAcidMutations: ['S:A123T'] },
            advancedQuery: '123T',
        });
        expect(pageState.variants.get(2)).toEqual({
            variantQuery: 'C234G',
        });
    });

    it('should convert page state to URL', () => {
        const pageState: CompareVariantsData = {
            variants: new Map([
                [
                    1,
                    {
                        lineages: { lineage: 'B.1.1.7' },
                        mutations: { nucleotideMutations: ['D614G'] },
                    },
                ],
                [
                    2,
                    {
                        lineages: { lineage: 'A.1.2.3' },
                        mutations: { aminoAcidMutations: ['S:A123T'] },
                        advancedQuery: '123T',
                    },
                ],
                [
                    3,
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
        };
        const url = handler.toUrl(pageState);
        expect(url).toBe(
            '/covid/compare-variants?' +
                'columns=3' +
                '&nucleotideMutations%240=D614G&lineage%240=B.1.1.7' +
                '&aminoAcidMutations%241=S%3AA123T&lineage%241=A.1.2.3&advancedQueryVariant%241=123T' +
                '&variantQuery%242=C234G' +
                '&country=US' +
                '&date=Last+7+Days' +
                '&advancedQuery=country%3DUS' +
                '&',
        );
    });

    it('should convert page state with deleted id to URL', () => {
        const pageState: CompareVariantsData = {
            variants: new Map([
                [
                    1,
                    {
                        lineages: { lineage: 'B.1.1.7' },
                        mutations: { nucleotideMutations: ['D614G'] },
                    },
                ],
                [
                    3,
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
        };
        const url = handler.toUrl(pageState);
        expect(url).toBe(
            '/covid/compare-variants?' +
                'columns=2' +
                '&nucleotideMutations%240=D614G&lineage%240=B.1.1.7' +
                '&variantQuery%241=C234G' +
                '&country=US' +
                '&date=Last+7+Days' +
                '&',
        );
    });

    it('should ignore date filters that are null when converting page state to URL', () => {
        const pageState: CompareVariantsData = {
            variants: new Map(),
            datasetFilter: {
                locationFilters: {},
                dateFilters: { date: null },
                textFilters: {},
                numberFilters: {},
            },
        };

        const url = handler.toUrl(pageState);

        expect(url).toBe('/covid/compare-variants');
    });

    it('should convert dataset filter to Lapis filter', () => {
        const lapisFilter = handler.datasetFilterToLapisFilter({
            ...mockDefaultPageState.datasetFilter,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            locationFilters: { 'country,region': { country: 'US' } },
            advancedQuery: 'country=US',
        });
        expect(lapisFilter).toStrictEqual({
            dateFrom: '2024-11-22',
            dateTo: '2024-11-29',
            country: 'US',
            advancedQuery: 'country=US',
        });
    });

    it('should convert the page state to a named variant filter', () => {
        const pageState: CompareVariantsData = {
            datasetFilter: {
                locationFilters: {},
                dateFilters: { date: mockDateRangeOption },
                textFilters: {},
                numberFilters: {},
                advancedQuery: 'country=US',
            },
            variants: new Map([
                [
                    1,
                    {
                        lineages: { lineage: 'B.1.1.7' },
                        mutations: { nucleotideMutations: ['D614G'], aminoAcidMutations: ['S:A123T'] },
                        advancedQuery: '123T',
                    },
                ],
                [
                    2,
                    {
                        variantQuery: 'C234G',
                    },
                ],
            ]),
        };
        const namedVariantFilter = handler.variantFiltersToNamedLapisFilters(pageState);
        expect(namedVariantFilter).deep.equal([
            {
                displayName: 'B.1.1.7 + D614G + S:A123T + 123T',
                lapisFilter: {
                    advancedQuery: '(country=US) and (123T)',
                    aminoAcidMutations: ['S:A123T'],
                    dateFrom: '2024-11-22',
                    dateTo: '2024-11-29',
                    lineage: 'B.1.1.7',
                    nucleotideMutations: ['D614G'],
                },
            },
            {
                displayName: 'C234G',
                lapisFilter: {
                    advancedQuery: 'country=US',
                    dateFrom: '2024-11-22',
                    dateTo: '2024-11-29',
                    variantQuery: 'C234G',
                },
            },
        ]);
    });
});
