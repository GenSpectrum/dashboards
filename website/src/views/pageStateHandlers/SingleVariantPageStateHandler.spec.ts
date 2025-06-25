import { describe, expect, it } from 'vitest';

import { Organisms } from '../../types/Organism.ts';
import type { OrganismConstants } from '../OrganismConstants.ts';
import type { DatasetAndVariantData } from '../View.ts';
import { SingleVariantPageStateHandler } from './SingleVariantPageStateHandler.ts';

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
    useVariantQuery: false,
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
            earliestDate: '1999-01-01',
            dateColumn: 'date',
        },
        {
            type: 'location',
            placeholderText: 'Some location',
            label: 'Some location',
            locationFields: ['country', 'region'],
        },
        {
            type: 'number',
            lapisField: 'someLapisNumberField',
            label: 'Some number',
        },
    ],
};

const mockDefaultPageState: DatasetAndVariantData = {
    datasetFilter: {
        locationFilters: {},
        dateFilters: {
            date: mockDateRangeOption,
        },
        textFilters: {},
        numberFilters: {
            someLapisNumberField: {
                min: 123,
            },
        },
    },
    variantFilter: {
        lineages: {},
        mutations: {},
    },
};

describe('SingleVariantPageStateHandler', () => {
    const handler = new SingleVariantPageStateHandler(mockConstants, mockDefaultPageState);

    it('should return the default page URL', () => {
        const url = handler.getDefaultPageUrl();
        expect(url).toBe('/covid/single-variant?date=Last+7+Days&someLapisNumberFieldFrom=123&');
    });

    it('should parse page state from URL, including variants', () => {
        const url = new URL(
            'http://example.com/covid/single-variant?' +
                'country=US' +
                '&date=Last 7 Days' +
                '&lineage=B.2.3.4' +
                '&nucleotideMutations=C234G' +
                '&advancedQuery=123T' +
                '&advancedQueryVariant=345G+%26+567C' +
                '&',
        );

        const pageState = handler.parsePageStateFromUrl(url);

        expect(pageState.datasetFilter).toEqual({
            locationFilters: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'country,region': { country: 'US' },
            },
            dateFilters: { date: mockDateRangeOption },
            advancedQuery: '123T',
            numberFilters: {},
            textFilters: {},
        });

        expect(pageState.variantFilter).toEqual({
            lineages: { lineage: 'B.2.3.4' },
            mutations: {
                nucleotideMutations: ['C234G'],
            },
            advancedQuery: '345G & 567C',
        });
    });

    it('should convert page state to URL', () => {
        const pageState: DatasetAndVariantData = {
            variantFilter: {
                lineages: { lineage: 'B.1.1.7' },
                mutations: { nucleotideMutations: ['D614G'] },
                advancedQuery: '345G & 567C',
            },
            datasetFilter: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                locationFilters: { 'country,region': { country: 'US' } },
                dateFilters: { date: mockDateRangeOption },
                textFilters: {},
                numberFilters: {},
                advancedQuery: 'country = Germany & 123T',
            },
        };
        const url = handler.toUrl(pageState);
        expect(url).toBe(
            '/covid/single-variant?' +
                'country=US' +
                '&date=Last+7+Days' +
                '&advancedQuery=country+%3D+Germany+%26+123T' +
                '&nucleotideMutations=D614G' +
                '&lineage=B.1.1.7' +
                '&advancedQueryVariant=345G+%26+567C' +
                '&',
        );
    });

    it('should ignore date filters that are null when converting page state to URL', () => {
        const pageState: DatasetAndVariantData = {
            variantFilter: {},
            datasetFilter: {
                locationFilters: {},
                dateFilters: { date: null },
                textFilters: {},
                numberFilters: {},
            },
        };
        const url = handler.toUrl(pageState);
        expect(url).toBe('/covid/single-variant');
    });

    it('should convert pageState to Lapis filter', () => {
        const lapisFilter = handler.toLapisFilter({
            datasetFilter: {
                locationFilters: {},
                dateFilters: {
                    date: mockDateRangeOption,
                },
                textFilters: {},
                numberFilters: {
                    someLapisNumberField: {
                        min: 123,
                    },
                },
                advancedQuery: 'country = Germany & 123T',
            },
            variantFilter: {
                lineages: { lineage: 'B.1.1.7' },
                mutations: { nucleotideMutations: ['D614G'] },
                advancedQuery: '345G & 567C',
            },
        });
        expect(lapisFilter).toStrictEqual({
            advancedQuery: '(country = Germany & 123T) and (345G & 567C)',
            dateFrom: '2024-11-22',
            dateTo: '2024-11-29',
            someLapisNumberFieldFrom: 123,
            lineage: 'B.1.1.7',
            nucleotideMutations: ['D614G'],
        });
    });

    it('should convert pageState with variantQuery to Lapis filter', () => {
        const lapisFilter = handler.toLapisFilter({
            ...mockDefaultPageState,
            variantFilter: {
                lineages: { lineage: 'B.1.1.7' },
                mutations: { nucleotideMutations: ['D614G'] },
                variantQuery: 'C234G',
            },
        });
        expect(lapisFilter).toStrictEqual({
            dateFrom: '2024-11-22',
            dateTo: '2024-11-29',
            someLapisNumberFieldFrom: 123,
            variantQuery: 'C234G',
        });
    });

    it('should convert pageState to Lapis filter without variant', () => {
        const lapisFilter = handler.toLapisFilterWithoutVariant({
            ...mockDefaultPageState,
            variantFilter: {
                lineages: { lineage: 'B.1.1.7' },
                mutations: { nucleotideMutations: ['D614G'] },
            },
        });
        expect(lapisFilter).toStrictEqual({
            dateFrom: '2024-11-22',
            dateTo: '2024-11-29',
            someLapisNumberFieldFrom: 123,
        });
    });
});
