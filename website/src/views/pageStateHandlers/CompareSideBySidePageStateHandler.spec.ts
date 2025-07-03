import { describe, expect, it } from 'vitest';

import { Organisms } from '../../types/Organism.ts';
import type { OrganismConstants } from '../OrganismConstants.ts';
import type { CompareSideBySideData, DatasetAndVariantData } from '../View.ts';
import { CompareSideBySideStateHandler } from './CompareSideBySidePageStateHandler.ts';

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
    useAdvancedQuery: false,
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

const mockDefaultPageState: CompareSideBySideData = {
    filters: new Map<number, DatasetAndVariantData>([
        [
            1,
            {
                datasetFilter: {
                    locationFilters: {},
                    dateFilters: {},
                    textFilters: {},
                    numberFilters: {},
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
                    locationFilters: {},
                    dateFilters: {
                        date: mockDateRangeOption,
                    },
                    textFilters: {},
                    numberFilters: {},
                },
                variantFilter: {
                    lineages: { lineage: 'B.1.1.7' },
                    mutations: {},
                },
            },
        ],
    ]),
};

describe('CompareSideBySideStateHandler', () => {
    const handler = new CompareSideBySideStateHandler(mockConstants, mockDefaultPageState);

    it('should return the default page URL', () => {
        const url = handler.getDefaultPageUrl();
        expect(url).toBe(
            '/covid/compare-side-by-side?' + 'columns=2' + '&lineage%241=B.1.1.7' + '&date%241=Last+7+Days' + '&',
        );
    });

    it('should parse page state from URL, including variants', () => {
        const url = new URL(
            'http://example.com/covid/compare-side-by-side?' +
                'columns=3' +
                '&lineage%241=B.1.1.7&date%241=Last+7+Days' +
                '&variantQuery%242=C234G' +
                '&',
        );

        const pageState = handler.parsePageStateFromUrl(url);

        expect(pageState.filters.size).toBe(3);

        expect(pageState.filters.get(0)).toEqual({
            datasetFilter: {
                locationFilters: {},
                dateFilters: {},
                textFilters: {},
                numberFilters: {},
            },
            variantFilter: {
                lineages: {},
                mutations: {},
            },
        });

        expect(pageState.filters.get(1)).toEqual({
            datasetFilter: {
                dateFilters: {
                    date: mockDateRangeOption,
                },
                textFilters: {},
                locationFilters: {},
                numberFilters: {},
            },
            variantFilter: {
                lineages: {
                    lineage: 'B.1.1.7',
                },
                mutations: {},
            },
        });

        expect(pageState.filters.get(2)).toEqual({
            datasetFilter: {
                dateFilters: {},
                locationFilters: {},
                textFilters: {},
                numberFilters: {},
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
                            locationFilters: {},
                            dateFilters: { date: mockDateRangeOption },
                            textFilters: {},
                            numberFilters: {},
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
                            locationFilters: {},
                            dateFilters: { date: mockDateRangeOption },
                            textFilters: {},
                            numberFilters: {},
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
            '/covid/compare-side-by-side?' +
                'columns=2' +
                '&lineage%240=B.1.1.7&date%240=Last+7+Days' +
                '&variantQuery%241=C234G&date%241=Last+7+Days' +
                '&',
        );
    });

    it('should ignore date filters that are null when converting page state to URL', () => {
        const pageState: CompareSideBySideData = {
            filters: new Map<number, DatasetAndVariantData>([
                [
                    1,
                    {
                        datasetFilter: {
                            locationFilters: {},
                            dateFilters: { date: null },
                            textFilters: {},
                            numberFilters: {},
                        },
                        variantFilter: {},
                    },
                ],
            ]),
        };

        const url = handler.toUrl(pageState);
        expect(url).toBe('/covid/compare-side-by-side?columns=1&');
    });

    it('should convert variant filter to Lapis filter', () => {
        const lapisFilter = handler.variantFilterToLapisFilter(
            {
                dateFilters: { date: mockDateRangeOption },
                // eslint-disable-next-line @typescript-eslint/naming-convention
                locationFilters: { 'country,region': { country: 'US' } },
                textFilters: {
                    someTextField: 'SomeText',
                },
                numberFilters: {},
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
            someTextField: 'SomeText',
        });
    });

    it('should convert variant filter with variantQuery to Lapis filter', () => {
        const lapisFilter = handler.variantFilterToLapisFilter(
            {
                dateFilters: { date: mockDateRangeOption },
                // eslint-disable-next-line @typescript-eslint/naming-convention
                locationFilters: { 'country,region': { country: 'US' } },
                textFilters: {
                    someTextField: 'SomeText',
                },
                numberFilters: {},
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
            someTextField: 'SomeText',
            variantQuery: 'C234G',
        });
    });
});
