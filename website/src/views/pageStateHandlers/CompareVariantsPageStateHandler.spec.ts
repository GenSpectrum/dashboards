import { describe, expect, it } from 'vitest';

import { Organisms } from '../../types/Organism.ts';
import type { ExtendedConstants } from '../OrganismConstants.ts';
import type { CompareVariantsData } from '../View.ts';
import { CompareVariantsPageStateHandler } from './CompareVariantsPageStateHandler.ts';

const mockDateRangeOption = { label: 'Last 7 Days', dateFrom: '2024-11-22', dateTo: '2024-11-29' };

const mockConstants: ExtendedConstants = {
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
            initialValue: undefined,
        },
    ],
    additionalSequencingEffortsFields: [],
    accessionDownloadFields: [],
    useAdvancedQuery: true,
    baselineFilterConfigs: [
        {
            type: 'text',
            lapisField: 'someTextField',
            placeholderText: 'Some text field',
            label: 'Some text field',
        },
        {
            type: 'date',
            dateRangeOptions: [mockDateRangeOption],
            earliestDate: '1999-01-01',
            defaultDateRange: mockDateRangeOption,
            dateColumn: 'date',
        },
    ],
};

const mockDefaultPageState: CompareVariantsData = {
    variants: new Map(),
    datasetFilter: {
        location: {},
        dateFilters: { date: mockDateRangeOption },
        textFilters: {},
    },
};

describe('CompareVariantsPageStateHandler', () => {
    const handler = new CompareVariantsPageStateHandler(mockConstants, mockDefaultPageState, 'testPath');

    it('should return the default page URL', () => {
        const url = handler.getDefaultPageUrl();
        expect(url).toBe('/testPath/compare-variants?date=Last+7+Days&');
    });

    it('should parse page state from URL, including variants', () => {
        const url = new URL(
            'http://example.com/testPath/compareVariants?' +
                'columns=3' +
                '&country=US&date=Last 7 Days' +
                '&lineage$0=B.1.1.7&nucleotideMutations$0=D614G' +
                '&lineage$1=A.1.2.3&aminoAcidMutations$1=S:A123T' +
                '&variantQuery$2=C234G' +
                '&',
        );

        const pageState = handler.parsePageStateFromUrl(url);

        expect(pageState.datasetFilter.location).toEqual({ country: 'US' });
        expect(pageState.datasetFilter.dateFilters).toEqual({ date: mockDateRangeOption });

        expect(pageState.variants.size).toBe(3);
        expect(pageState.variants.get(0)).toEqual({
            lineages: { lineage: 'B.1.1.7' },
            mutations: { nucleotideMutations: ['D614G'] },
        });
        expect(pageState.variants.get(1)).toEqual({
            lineages: { lineage: 'A.1.2.3' },
            mutations: { aminoAcidMutations: ['S:A123T'] },
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
                location: { country: 'US' },
                dateFilters: { date: mockDateRangeOption },
                textFilters: {},
            },
        };
        const url = handler.toUrl(pageState);
        expect(url).toBe(
            '/testPath/compare-variants?' +
                'columns=3' +
                '&nucleotideMutations%241=D614G&lineage%241=B.1.1.7' +
                '&aminoAcidMutations%242=S%3AA123T&lineage%242=A.1.2.3' +
                '&variantQuery%243=C234G' +
                '&country=US' +
                '&date=Last+7+Days' +
                '&',
        );
    });

    it('should convert dataset filter to Lapis filter', () => {
        const lapisFilter = handler.datasetFilterToLapisFilter({
            ...mockDefaultPageState.datasetFilter,
            location: { country: 'US' },
        });
        expect(lapisFilter).toStrictEqual({
            dateFrom: '2024-11-22',
            dateTo: '2024-11-29',
            country: 'US',
        });
    });

    it('should return empty variant filter config', () => {
        const variantFilterConfig = handler.getEmptyVariantFilterConfig();
        expect(variantFilterConfig).toStrictEqual({
            lineageFilterConfigs: [
                {
                    lapisField: 'lineage',
                    placeholderText: 'Lineage',
                    filterType: 'text',
                    initialValue: undefined,
                },
            ],
            mutationFilterConfig: {},
            isInVariantQueryMode: false,
            variantQueryConfig: undefined,
        });
    });

    it('should convert pageState to variant filter configs', () => {
        const pageState: CompareVariantsData = {
            ...mockDefaultPageState,
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
                    },
                ],
                [
                    3,
                    {
                        variantQuery: 'C234G',
                    },
                ],
            ]),
        };
        const variantFilterConfigs = handler.toVariantFilterConfigs(pageState);
        expect(variantFilterConfigs.size).toBe(3);
        expect(variantFilterConfigs.get(1)).toStrictEqual({
            lineageFilterConfigs: [
                {
                    lapisField: 'lineage',
                    placeholderText: 'Lineage',
                    filterType: 'text',
                    initialValue: 'B.1.1.7',
                },
            ],
            mutationFilterConfig: {
                nucleotideMutations: ['D614G'],
            },
            isInVariantQueryMode: false,
            variantQueryConfig: undefined,
        });

        expect(variantFilterConfigs.get(2)).toStrictEqual({
            lineageFilterConfigs: [
                {
                    lapisField: 'lineage',
                    placeholderText: 'Lineage',
                    filterType: 'text',
                    initialValue: 'A.1.2.3',
                },
            ],
            mutationFilterConfig: {
                aminoAcidMutations: ['S:A123T'],
            },
            isInVariantQueryMode: false,
            variantQueryConfig: undefined,
        });

        expect(variantFilterConfigs.get(3)).toStrictEqual({
            lineageFilterConfigs: [
                {
                    filterType: 'text',
                    initialValue: undefined,
                    lapisField: 'lineage',
                    placeholderText: 'Lineage',
                },
            ],
            mutationFilterConfig: {},
            isInVariantQueryMode: true,
            variantQueryConfig: 'C234G',
        });
    });

    it('should convert the page state to a named variant filter', () => {
        const pageState: CompareVariantsData = {
            ...mockDefaultPageState,
            variants: new Map([
                [
                    1,
                    {
                        lineages: { lineage: 'B.1.1.7' },
                        mutations: { nucleotideMutations: ['D614G'], aminoAcidMutations: ['S:A123T'] },
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
                displayName: 'B.1.1.7 + D614G + S:A123T',
                lapisFilter: {
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
                    dateFrom: '2024-11-22',
                    dateTo: '2024-11-29',
                    variantQuery: 'C234G',
                },
            },
        ]);
    });
});
