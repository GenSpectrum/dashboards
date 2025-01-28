import { describe, expect, it } from 'vitest';

import { Organisms } from '../../types/Organism.ts';
import type { ExtendedConstants } from '../OrganismConstants.ts';
import type { DatasetAndVariantData } from '../View.ts';
import { SingleVariantPageStateHandler } from './SingleVariantPageStateHandler.ts';

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

const mockDefaultPageState: DatasetAndVariantData = {
    datasetFilter: {
        location: {},
        dateRange: { label: 'Last 7 Days', dateFrom: '2024-11-22', dateTo: '2024-11-29' },
    },
    variantFilter: {
        lineages: {},
        mutations: {},
    },
};

describe('SingleVariantPageStateHandler', () => {
    const handler = new SingleVariantPageStateHandler(mockConstants, mockDefaultPageState, 'testPath');

    it('should return the default page URL', () => {
        const url = handler.getDefaultPageUrl();
        expect(url).toBe('/testPath/single-variant?date=Last+7+Days&');
    });

    it('should parse page state from URL, including variants', () => {
        const url = new URL(
            'http://example.com/testPath/single-variant?' +
                'country=US&date=Last 7 Days' +
                '&lineage=B.2.3.4&nucleotideMutations=C234G' +
                '&',
        );

        const pageState = handler.parsePageStateFromUrl(url);

        expect(pageState.datasetFilter.location).toEqual({ country: 'US' });
        expect(pageState.datasetFilter.dateRange).toEqual(mockConstants.defaultDateRange);

        expect(pageState.variantFilter).toEqual({
            lineages: { lineage: 'B.2.3.4' },
            mutations: {
                nucleotideMutations: ['C234G'],
            },
            variantQuery: undefined,
        });
    });

    it('should convert page state to URL', () => {
        const pageState: DatasetAndVariantData = {
            variantFilter: {
                lineages: { lineage: 'B.1.1.7' },
                mutations: { nucleotideMutations: ['D614G'] },
            },
            datasetFilter: {
                location: { country: 'US' },
                dateRange: mockConstants.defaultDateRange,
            },
        };
        const url = handler.toUrl(pageState);
        expect(url).toBe(
            '/testPath/single-variant?' + 'country=US' + '&nucleotideMutations=D614G&lineage=B.1.1.7' + '&',
        );
    });

    it('should convert pageState to Lapis filter', () => {
        const lapisFilter = handler.toLapisFilter({
            ...mockDefaultPageState,
            variantFilter: {
                lineages: { lineage: 'B.1.1.7' },
                mutations: { nucleotideMutations: ['D614G'] },
            },
        });
        expect(lapisFilter).toStrictEqual({
            dateFrom: '2024-11-22',
            dateTo: '2024-11-29',
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
        });
    });
});
