import { describe, expect, it } from 'vitest';

import { Organisms } from '../../types/Organism.ts';
import type { ExtendedConstants } from '../OrganismConstants.ts';
import type { CompareSideBySideData, DatasetAndVariantData } from '../View.ts';
import { GenericCompareSideBySideStateHandler } from './CompareSideBySidePageStateHandler.ts';

const mockConstants: ExtendedConstants = {
    organism: Organisms.covid,
    dataOrigins: [],
    locationFields: ['country', 'region'],
    mainDateField: 'date',
    dateRangeOptions: [{ label: 'Last 7 Days', dateFrom: '2024-11-22', dateTo: '2024-11-29' }],
    defaultDateRange: { label: 'Last 7 Days', dateFrom: '2024-11-22', dateTo: '2024-11-29' },
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
    useAdvancedQuery: false,
};

const mockDefaultPageState: CompareSideBySideData = {
    filters: new Map<number, DatasetAndVariantData>([
        [
            1,
            {
                datasetFilter: {
                    location: {},
                    dateRange: { label: 'Last 7 Days', dateFrom: '2024-11-22', dateTo: '2024-11-29' },
                },
                variantFilter: {
                    lineages: {},
                    mutations: {},
                },
            },
        ],
        [
            2,
            {
                datasetFilter: {
                    location: {},
                    dateRange: { label: 'Last 7 Days', dateFrom: '2024-11-22', dateTo: '2024-11-29' },
                },
                variantFilter: {
                    lineages: { lineage: 'B.1.1.7' },
                    mutations: {},
                },
            },
        ],
    ]),
};

describe('GenericCompareSideBySideStateHandler', () => {
    const handler = new GenericCompareSideBySideStateHandler(mockConstants, mockDefaultPageState, 'testPath');

    it('should return the default page URL', () => {
        const url = handler.getDefaultPageUrl();
        expect(url).toBe(
            '/testPath/compare-side-by-side?' +
                'date%241=Last+7+Days' +
                '&lineage%242=B.1.1.7&date%242=Last+7+Days' +
                '&',
        );
    });

    it('should parse page state from URL, including variants', () => {
        const url = new URL(
            'http://example.com/testPath/compare-side-by-side?' +
                'date%241=Last+7+Days' +
                '&lineage%242=B.1.1.7&date%242=Last+7+Days' +
                '&variantQuery%243=C234G' +
                '&',
        );

        const pageState = handler.parsePageStateFromUrl(url);

        expect(pageState.filters.size).toBe(3);

        expect(pageState.filters.get(1)).toEqual({
            datasetFilter: {
                dateRange: {
                    label: 'Last 7 Days',
                    dateFrom: '2024-11-22',
                    dateTo: '2024-11-29',
                },
                location: {},
            },
            variantFilter: {
                lineages: {},
                mutations: {},
            },
        });

        expect(pageState.filters.get(2)).toEqual({
            datasetFilter: {
                dateRange: {
                    label: 'Last 7 Days',
                    dateFrom: '2024-11-22',
                    dateTo: '2024-11-29',
                },
                location: {},
            },
            variantFilter: {
                lineages: {
                    lineage: 'B.1.1.7',
                },
                mutations: {},
            },
        });

        expect(pageState.filters.get(3)).toEqual({
            datasetFilter: {
                dateRange: {
                    label: 'Last 7 Days',
                    dateFrom: '2024-11-22',
                    dateTo: '2024-11-29',
                },
                location: {},
            },
            variantFilter: {
                variantQuery: 'C234G',
            },
        });
    });

    it('should convert page state to URL', () => {
        const pageState: CompareSideBySideData = {
            filters: new Map<number, DatasetAndVariantData>([
                [
                    1,
                    {
                        datasetFilter: {
                            location: {},
                            dateRange: { label: 'Last 7 Days', dateFrom: '2024-11-22', dateTo: '2024-11-29' },
                        },
                        variantFilter: {
                            lineages: { lineage: 'B.1.1.7' },
                            mutations: {},
                        },
                    },
                ],
                [
                    2,
                    {
                        datasetFilter: {
                            location: {},
                            dateRange: { label: 'Last 7 Days', dateFrom: '2024-11-22', dateTo: '2024-11-29' },
                        },
                        variantFilter: {
                            lineages: { lineage: 'B.1.1.7' },
                            mutations: {},
                            variantQuery: 'C234G',
                        },
                    },
                ],
            ]),
        };

        const url = handler.toUrl(pageState);
        expect(url).toBe(
            '/testPath/compare-side-by-side?' +
                'lineage%241=B.1.1.7&date%241=Last+7+Days' +
                '&variantQuery%242=C234G&date%242=Last+7+Days' +
                '&',
        );
    });

    it('should convert variant filter to Lapis filter', () => {
        const lapisFilter = handler.variantFilterToLapisFilter(
            {
                dateRange: { label: 'Last 7 Days', dateFrom: '2024-11-22', dateTo: '2024-11-29' },
                location: { country: 'US' },
            },
            {
                lineages: { lineage: 'B.1.1.7' },
                mutations: { nucleotideMutations: ['A123T'] },
            },
        );
        expect(lapisFilter).toStrictEqual({
            dateFrom: '2024-11-22',
            dateTo: '2024-11-29',
            country: 'US',
            lineage: 'B.1.1.7',
            nucleotideMutations: ['A123T'],
        });
    });

    it('should convert variant filter with variantQuery to Lapis filter', () => {
        const lapisFilter = handler.variantFilterToLapisFilter(
            {
                dateRange: { label: 'Last 7 Days', dateFrom: '2024-11-22', dateTo: '2024-11-29' },
                location: { country: 'US' },
            },
            {
                lineages: { lineage: 'B.1.1.7' },
                mutations: {},
                variantQuery: 'C234G',
            },
        );
        expect(lapisFilter).toStrictEqual({
            dateFrom: '2024-11-22',
            dateTo: '2024-11-29',
            country: 'US',
            variantQuery: 'C234G',
        });
    });
});
