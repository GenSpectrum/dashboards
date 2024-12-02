import { describe, expect, it } from 'vitest';

import { Organisms } from '../../types/Organism.ts';
import type { SingleVariantConstants } from '../OrganismConstants.ts';
import type { CompareToBaselineData } from '../View.ts';
import { CompareToBaselineStateHandler } from './CompareToBaselinePageStateHandler.ts';

const mockConstants: SingleVariantConstants = {
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
};

const mockDefaultPageState: CompareToBaselineData = {
    variants: new Map(),
    datasetFilter: {
        location: {},
        dateRange: { label: 'Last 7 Days', dateFrom: '2024-11-22', dateTo: '2024-11-29' },
    },
    baselineFilter: {
        lineages: {},
        mutations: {},
    },
};

describe('CompareToBaselinePageStateHandler', () => {
    const handler = new CompareToBaselineStateHandler(mockConstants, mockDefaultPageState, 'testPath');

    it('should return the default page URL', () => {
        const url = handler.getDefaultPageUrl();
        expect(url).toBe('/testPath/compare-to-baseline?date=Last+7+Days');
    });

    it('should parse page state from URL, including variants', () => {
        const url = new URL(
            'http://example.com/testPath/compare-to-baseline?' +
                'country=US&date=Last 7 Days' +
                '&lineage=B.2.3.4&nucleotideMutations=C234G' +
                '&lineage$1=B.1.1.7&nucleotideMutations$1=D614G' +
                '&lineage$2=A.1.2.3&aminoAcidMutations$2=S:A123T',
        );

        const pageState = handler.parsePageStateFromUrl(url);

        expect(pageState.datasetFilter.location).toEqual({ country: 'US' });
        expect(pageState.datasetFilter.dateRange).toEqual(mockConstants.defaultDateRange);

        expect(pageState.baselineFilter).toEqual({
            lineages: { lineage: 'B.2.3.4' },
            mutations: {
                nucleotideMutations: ['C234G'],
            },
        });

        expect(pageState.variants.size).toBe(2);
        expect(pageState.variants.get(1)).toEqual({
            lineages: { lineage: 'B.1.1.7' },
            mutations: { nucleotideMutations: ['D614G'] },
        });
        expect(pageState.variants.get(2)).toEqual({
            lineages: { lineage: 'A.1.2.3' },
            mutations: { aminoAcidMutations: ['S:A123T'] },
        });
    });

    it('should convert page state to URL', () => {
        const pageState: CompareToBaselineData = {
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
            ]),
            datasetFilter: {
                location: { country: 'US' },
                dateRange: mockConstants.defaultDateRange,
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
            '/testPath/compare-to-baseline?' +
                'nucleotideMutations%241=D614G&lineage%241=B.1.1.7' +
                '&aminoAcidMutations%242=S%3AA123T&lineage%242=A.1.2.3' +
                '&country=US' +
                '&nucleotideMutations=C234G&lineage=B.2.3.4',
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
        });
    });

    it('should convert pageState to variant filter configs', () => {
        const pageState: CompareToBaselineData = {
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
            ]),
        };
        const variantFilterConfigs = handler.toVariantFilterConfigs(pageState);
        expect(variantFilterConfigs.size).toBe(2);
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
        ]);
    });

    it('should convert the page state to a baseline lapis filter', () => {
        const pageState: CompareToBaselineData = {
            ...mockDefaultPageState,
            baselineFilter: {
                lineages: { lineage: 'B.1.1.7' },
                mutations: { nucleotideMutations: ['D614G'] },
            },
        };

        const baselineLapisFilter = handler.baselineFilterToLapisFilter(pageState);

        expect(baselineLapisFilter).toStrictEqual({
            dateFrom: '2024-11-22',
            dateTo: '2024-11-29',
            lineage: 'B.1.1.7',
            nucleotideMutations: ['D614G'],
        });
    });
});
