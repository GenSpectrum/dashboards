import { describe, expect, it } from 'vitest';

import type { SingleVariantConstants } from './OrganismConstants.ts';
import { CompareVariantsStateHandler } from './PageStateHandler.ts';
import type { CompareVariantsData } from './View';
import { Organisms } from '../types/Organism.ts';

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

const mockDefaultPageState: CompareVariantsData = {
    variants: new Map(),
    baselineFilter: {
        location: {},
        dateRange: { label: 'Last 7 Days', dateFrom: '2024-11-22', dateTo: '2024-11-29' },
    },
};

describe('CompareVariantsStateHandler', () => {
    const handler = new CompareVariantsStateHandler(mockConstants, mockDefaultPageState, 'testPath');

    it('should return the default page URL', () => {
        const url = handler.getDefaultPageUrl();
        expect(url).toBe('/testPath/compare-variants?date=Last+7+Days');
    });

    it('should parse page state from URL, including variants', () => {
        const url = new URL(
            'http://example.com/testPath/compareVariants?country=US&date=Last 7 Days' +
                '&lineage$1=B.1.1.7&nucleotideMutations$1=D614G' +
                '&lineage$2=A.1.2.3&aminoAcidMutations$2=S:A123T',
        );

        const pageState = handler.parsePageStateFromUrl(url);

        expect(pageState.baselineFilter.location).toEqual({ country: 'US' });
        expect(pageState.baselineFilter.dateRange).toEqual(mockConstants.defaultDateRange);

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
            ]),
            baselineFilter: {
                location: { country: 'US' },
                dateRange: mockConstants.defaultDateRange,
            },
        };
        const url = handler.toUrl(pageState);
        expect(url).toBe(
            '/testPath/compare-variants?' +
                'nucleotideMutations%241=D614G&lineage%241=B.1.1.7' +
                '&aminoAcidMutations%242=S%3AA123T&lineage%242=A.1.2.3' +
                '&country=US',
        );
    });

    it('should convert baseline filter to Lapis filter', () => {
        const lapisFilter = handler.baselineFilterToLapisFilter({
            ...mockDefaultPageState.baselineFilter,
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
            mutationFilterConfig: {
                aminoAcidInsertions: [],
                aminoAcidMutations: [],
                nucleotideInsertions: [],
                nucleotideMutations: [],
            },
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
                aminoAcidInsertions: [],
                aminoAcidMutations: [],
                nucleotideInsertions: [],
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
                aminoAcidInsertions: [],
                aminoAcidMutations: ['S:A123T'],
                nucleotideInsertions: [],
                nucleotideMutations: [],
            },
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
});
