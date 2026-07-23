import dayjs from 'dayjs';
import { http } from 'msw';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { fetchWasapPageData, getLapisFilterForTimeFrame } from './useWasapPageData.ts';
import {
    EXCLUDE_SET_NAME,
    SEQUENCE_TYPE,
    SIGNATURE_TYPE,
    VARIANT_TIME_FRAME,
    WASAP_ANALYSIS_MODE,
    type WasapPageConfig,
} from './wasapPageConfig.ts';
import { DUMMY_BACKEND_URL, DUMMY_LAPIS_URL } from '../../../../routeMocker.ts';
import { astroApiRouteMocker, backendRouteMocker, lapisRouteMocker, testServer } from '../../../../vitest.setup.ts';
import type { Collection } from '../../../types/Collection.ts';

vi.mock('../../../backendApi/backendService.ts', async (importOriginal) => {
    const mod = await importOriginal<typeof import('../../../backendApi/backendService.ts')>();
    return {
        ...mod,
        getBackendServiceForClientside: () => new mod.BackendService(DUMMY_BACKEND_URL),
    };
});

const DUMMY_COV_SPECTRUM_URL = 'http://cov-spectrum.dummy/api/v2';

// these fields have no effect on data fetching, but need to be present to have a correct type.
const unusedBaseConfigFields = {
    internalName: 'covid' as const,
    name: '',
    path: '',
    description: '',
    linkTemplate: { nucleotideMutation: '', aminoAcidMutation: '' },
    samplingDateField: '',
    locationNameField: '',
    defaultLocationName: '',
    browseDataUrl: '',
    browseDataDescription: '',
};

const baseConfigFields: WasapPageConfig = {
    ...unusedBaseConfigFields,
    lapisBaseUrl: DUMMY_LAPIS_URL,
};

describe('fetchWasapPageData', () => {
    beforeEach(() => {
        astroApiRouteMocker.mockLog();
    });

    describe('manual mode', () => {
        const config = {
            ...baseConfigFields,
            manualAnalysisModeEnabled: true as const,
            filterDefaults: { manual: { mode: WASAP_ANALYSIS_MODE.manual, sequenceType: SEQUENCE_TYPE.nucleotide } },
        };

        test('returns mutations when mode is enabled', async () => {
            const result = await fetchWasapPageData(
                config,
                {},
                {
                    mode: WASAP_ANALYSIS_MODE.manual,
                    sequenceType: SEQUENCE_TYPE.nucleotide,
                    mutations: ['A123T', 'G456C'],
                },
            );

            expect(result).toEqual({ type: 'mutations', displayMutations: ['A123T', 'G456C'] });
        });

        test('throws when mode is not enabled', async () => {
            const disabledConfig = { ...baseConfigFields };

            await expect(
                fetchWasapPageData(
                    disabledConfig,
                    {},
                    { mode: WASAP_ANALYSIS_MODE.manual, sequenceType: SEQUENCE_TYPE.nucleotide, mutations: [] },
                ),
            ).rejects.toThrow("Cannot fetch data, 'manual' mode is not enabled.");
        });
    });

    describe('resistance mode', () => {
        test('returns mutations for the given resistance set', async () => {
            const result = await fetchWasapPageData(
                baseConfigFields,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                { Spike: ['S:E484K', 'S:N501Y'] },
                { mode: WASAP_ANALYSIS_MODE.resistance, sequenceType: SEQUENCE_TYPE.aminoAcid, resistanceSet: 'Spike' },
            );

            expect(result).toEqual({ type: 'mutations', displayMutations: ['S:E484K', 'S:N501Y'] });
        });

        test('returns empty array for unknown resistance set', async () => {
            const result = await fetchWasapPageData(
                baseConfigFields,
                {},
                {
                    mode: WASAP_ANALYSIS_MODE.resistance,
                    sequenceType: SEQUENCE_TYPE.aminoAcid,
                    resistanceSet: 'Unknown',
                },
            );

            expect(result).toEqual({ type: 'mutations', displayMutations: [] });
        });
    });

    describe('variant mode', () => {
        const config = {
            ...baseConfigFields,
            variantAnalysisModeEnabled: true as const,
            clinicalLapis: {
                lapisBaseUrl: DUMMY_LAPIS_URL,
                dateField: 'date',
                lineageField: 'pangoLineage',
            },
            filterDefaults: {
                variant: {
                    mode: WASAP_ANALYSIS_MODE.variant,
                    signatureType: SIGNATURE_TYPE.computed,
                    sequenceType: SEQUENCE_TYPE.nucleotide,
                    variant: 'XEC',
                    minProportion: 0.8,
                    minCount: 15,
                    minJaccard: 0.3,
                    timeFrame: VARIANT_TIME_FRAME.all,
                },
            },
            clinicalSequenceCountWarningThreshold: 100,
        };

        test('computed signature: fetches mutations from clinical LAPIS and annotates with jaccard scores', async () => {
            // getMutationsForVariant makes 3 concurrent requests:
            // (1) mutations with lineage filter, (2) all mutations, (3) total count for the lineage
            lapisRouteMocker.mockPostNucleotideMutationsMulti([
                {
                    body: { pangoLineage: 'XEC', minProportion: 0.8 },
                    response: { data: [{ mutation: 'A123T', count: 100 }] },
                },
                {
                    body: { minProportion: 0 },
                    response: { data: [{ mutation: 'A123T', count: 200 }] },
                },
            ]);
            lapisRouteMocker.mockPostAggregated({ pangoLineage: 'XEC' }, { data: [{ count: 150 }] });

            const result = await fetchWasapPageData(
                config,
                {},
                {
                    mode: WASAP_ANALYSIS_MODE.variant,
                    signatureType: SIGNATURE_TYPE.computed,
                    sequenceType: SEQUENCE_TYPE.nucleotide,
                    variant: 'XEC',
                    minProportion: 0.8,
                    minCount: 15,
                    minJaccard: 0.3,
                    timeFrame: VARIANT_TIME_FRAME.all,
                },
            );

            // Jaccard for A123T: 100 / (150 + 200 - 100) = 0.4, which passes minJaccard=0.3
            expect(result).toEqual({
                type: 'mutations',
                displayMutations: ['A123T'],
                // eslint-disable-next-line @typescript-eslint/naming-convention
                customColumns: [{ header: 'Jaccard index', values: { A123T: (0.4).toPrecision(2) } }],
            });
        });

        test('predefined signature: fetches collection from backend and returns mutations with empty jaccard', async () => {
            backendRouteMocker.mockGetCollection('1', {
                id: 1,
                name: 'XEC',
                ownedBy: 1,
                organism: 'sc2',
                description: null,
                variantCount: 1,
                tags: [],
                variants: [
                    {
                        type: 'filterObject',
                        id: 1,
                        collectionId: 1,
                        name: 'Nucleotide substitutions',
                        description: null,
                        filterObject: { nucleotideMutations: ['A123T', 'G456C'] },
                    },
                ],
            } as unknown as Collection);
            // Empty clinical LAPIS data → jaccard map is empty → mutations returned unfiltered
            lapisRouteMocker.mockPostNucleotideMutationsMulti([
                { body: { pangoLineage: 'XEC*', minProportion: 0 }, response: { data: [] } },
                { body: { minProportion: 0 }, response: { data: [] } },
            ]);
            lapisRouteMocker.mockPostAggregated({ pangoLineage: 'XEC*' }, { data: [{ count: 0 }] });

            const result = await fetchWasapPageData(
                config,
                {},
                {
                    mode: WASAP_ANALYSIS_MODE.variant,
                    signatureType: SIGNATURE_TYPE.predefined,
                    sequenceType: SEQUENCE_TYPE.nucleotide,
                    minProportion: -1,
                    minCount: -1,
                    minJaccard: -1,
                    timeFrame: VARIANT_TIME_FRAME.all,
                    collectionId: 1,
                    includeSublineagesForJaccard: true,
                },
            );

            expect(result).toEqual({
                type: 'mutations',
                displayMutations: ['A123T', 'G456C'],
                lineageForJaccard: 'XEC*',
            });
        });

        test('predefined signature: filters mutations by jaccard and returns customColumns', async () => {
            backendRouteMocker.mockGetCollection('1', {
                id: 1,
                name: 'XEC',
                ownedBy: 1,
                organism: 'sc2',
                description: null,
                variantCount: 1,
                tags: [],
                variants: [
                    {
                        type: 'filterObject',
                        id: 1,
                        collectionId: 1,
                        name: 'Nucleotide substitutions',
                        description: null,
                        filterObject: { nucleotideMutations: ['A123T', 'G456C'] },
                    },
                ],
            } as unknown as Collection);
            lapisRouteMocker.mockPostNucleotideMutationsMulti([
                {
                    body: { pangoLineage: 'XEC*', minProportion: 0 },
                    response: {
                        data: [
                            { mutation: 'A123T', count: 100 },
                            { mutation: 'G456C', count: 10 },
                        ],
                    },
                },
                {
                    body: { minProportion: 0 },
                    response: {
                        data: [
                            { mutation: 'A123T', count: 200 },
                            { mutation: 'G456C', count: 200 },
                        ],
                    },
                },
            ]);
            lapisRouteMocker.mockPostAggregated({ pangoLineage: 'XEC*' }, { data: [{ count: 150 }] });

            const result = await fetchWasapPageData(
                config,
                {},
                {
                    mode: WASAP_ANALYSIS_MODE.variant,
                    signatureType: SIGNATURE_TYPE.predefined,
                    sequenceType: SEQUENCE_TYPE.nucleotide,
                    minProportion: -1,
                    minCount: -1,
                    minJaccard: 0.3,
                    timeFrame: VARIANT_TIME_FRAME.all,
                    collectionId: 1,
                    includeSublineagesForJaccard: true,
                },
            );

            // Jaccard for A123T: 100 / (150 + 200 - 100) = 0.4, passes minJaccard=0.3
            // Jaccard for G456C: 10 / (150 + 200 - 10) ≈ 0.029, fails minJaccard=0.3
            expect(result).toEqual({
                type: 'mutations',
                displayMutations: ['A123T'],
                lineageForJaccard: 'XEC*',
                // eslint-disable-next-line @typescript-eslint/naming-convention
                customColumns: [{ header: 'Jaccard index', values: { A123T: (0.4).toPrecision(2) } }],
            });
        });

        test('throws when mode is not enabled', async () => {
            const disabledConfig = { ...baseConfigFields };

            await expect(
                fetchWasapPageData(
                    disabledConfig,
                    {},
                    {
                        mode: WASAP_ANALYSIS_MODE.variant,
                        signatureType: SIGNATURE_TYPE.computed,
                        sequenceType: SEQUENCE_TYPE.nucleotide,
                        variant: 'XEC',
                        minProportion: 0.8,
                        minCount: 15,
                        minJaccard: 0.3,
                        timeFrame: VARIANT_TIME_FRAME.all,
                    },
                ),
            ).rejects.toThrow("Cannot fetch data, 'variant' mode is not enabled.");
        });
    });

    describe('untracked mode', () => {
        const config = {
            ...baseConfigFields,
            lapisBaseUrl: DUMMY_LAPIS_URL,
            untrackedAnalysisModeEnabled: true as const,
            clinicalLapis: {
                lapisBaseUrl: DUMMY_LAPIS_URL,
                cladeField: 'clade',
                lineageField: 'pangoLineage',
            },
            filterDefaults: {
                untracked: { mode: WASAP_ANALYSIS_MODE.untracked, sequenceType: SEQUENCE_TYPE.nucleotide },
            },
        };

        test('custom exclude set: filters out mutations belonging to the specified variants', async () => {
            lapisRouteMocker.mockPostNucleotideMutationsMulti([
                {
                    body: { pangoLineage: 'XEC', minProportion: 0.8 },
                    response: { data: [{ mutation: 'A123T', count: 100 }] },
                },
                {
                    body: { pangoLineage: 'JN.1', minProportion: 0.8 },
                    response: { data: [{ mutation: 'G456C', count: 50 }] },
                },
                {
                    body: { minProportion: 0.05 },
                    response: {
                        data: [
                            { mutation: 'A123T', count: 200 },
                            { mutation: 'G456C', count: 150 },
                            { mutation: 'C789T', count: 10 },
                        ],
                    },
                },
            ]);

            const result = await fetchWasapPageData(
                config,
                {},
                {
                    mode: WASAP_ANALYSIS_MODE.untracked,
                    sequenceType: SEQUENCE_TYPE.nucleotide,
                    excludeSet: EXCLUDE_SET_NAME.custom,
                    excludeVariants: ['XEC', 'JN.1'],
                },
            );

            expect(result).toEqual({ type: 'mutations', displayMutations: ['C789T'] });
        });

        test('predefined exclude set: derives excluded variants from clade-lineage mapping', async () => {
            lapisRouteMocker.mockPostAggregated(
                {
                    fields: ['clade', 'pangoLineage'],
                    orderBy: ['clade', { field: 'count', type: 'descending' }],
                },
                { data: [{ clade: '24A', pangoLineage: 'JN.1', count: 1000 }] },
            );
            lapisRouteMocker.mockPostNucleotideMutationsMulti([
                {
                    body: { pangoLineage: 'JN.1*', minProportion: 0.8 },
                    response: { data: [{ mutation: 'A123T', count: 100 }] },
                },
                {
                    body: { minProportion: 0.05 },
                    response: {
                        data: [
                            { mutation: 'A123T', count: 200 },
                            { mutation: 'C789T', count: 10 },
                        ],
                    },
                },
            ]);

            const result = await fetchWasapPageData(
                config,
                {},
                {
                    mode: WASAP_ANALYSIS_MODE.untracked,
                    sequenceType: SEQUENCE_TYPE.nucleotide,
                    excludeSet: EXCLUDE_SET_NAME.predefined,
                },
            );

            expect(result).toEqual({ type: 'mutations', displayMutations: ['C789T'] });
        });

        test('throws when mode is not enabled', async () => {
            const disabledConfig = { ...baseConfigFields };

            await expect(
                fetchWasapPageData(
                    disabledConfig,
                    {},
                    { mode: WASAP_ANALYSIS_MODE.untracked, sequenceType: SEQUENCE_TYPE.nucleotide },
                ),
            ).rejects.toThrow("Cannot fetch data, 'untracked' mode is not enabled.");
        });
    });

    describe('covSpectrumCollection mode', () => {
        const config = {
            ...baseConfigFields,
            lapisBaseUrl: DUMMY_LAPIS_URL,
            covSpectrumCollectionAnalysisModeEnabled: true as const,
            collectionsApiBaseUrl: DUMMY_COV_SPECTRUM_URL,
            collectionTitleFilter: '',
            filterDefaults: {
                covSpectrumCollection: { mode: WASAP_ANALYSIS_MODE.covSpectrumCollection, collectionId: 42 },
            },
        };

        test('fetches collection from CovSpectrum and builds queries for each variant', async () => {
            testServer.use(
                http.get(`${DUMMY_COV_SPECTRUM_URL}/resource/collection/42`, () =>
                    Response.json({
                        id: 42,
                        title: 'Test Collection',
                        description: 'A test',
                        maintainers: 'Testers',
                        email: 'test@example.com',
                        variants: [
                            {
                                query: JSON.stringify({ type: 'variantQuery', variantQuery: 'JN.1*' }),
                                name: 'JN.1',
                                description: '',
                                highlighted: false,
                            },
                            {
                                query: JSON.stringify({ type: 'variantQuery', variantQuery: 'XEC*' }),
                                name: 'XEC',
                                description: 'XEC lineage',
                                highlighted: false,
                            },
                        ],
                    }),
                ),
            );
            lapisRouteMocker.mockPostQueryParse(
                { queries: ['JN.1*', 'XEC*'] },
                {
                    data: [
                        {
                            type: 'success',
                            filter: { type: 'HasNucleotideMutation', sequenceName: 'main', position: 123 },
                        },
                        {
                            type: 'success',
                            filter: { type: 'HasNucleotideMutation', sequenceName: 'main', position: 456 },
                        },
                    ],
                },
            );

            const result = await fetchWasapPageData(
                config,
                {},
                { mode: WASAP_ANALYSIS_MODE.covSpectrumCollection, collectionId: 42 },
            );

            expect(result).toEqual({
                type: 'collection',
                collection: {
                    id: 42,
                    title: 'Test Collection',
                    queries: [
                        {
                            displayLabel: 'JN.1',
                            description: undefined,
                            countQuery: 'JN.1*',
                            coverageQuery: '(JN.1*) or (not maybe(JN.1*))',
                        },
                        {
                            displayLabel: 'XEC',
                            description: 'XEC lineage',
                            countQuery: 'XEC*',
                            coverageQuery: '(XEC*) or (not maybe(XEC*))',
                        },
                    ],
                },
            });
        });

        test('reports variants that fail query parsing as invalid', async () => {
            testServer.use(
                http.get(`${DUMMY_COV_SPECTRUM_URL}/resource/collection/42`, () =>
                    Response.json({
                        id: 42,
                        title: 'Test Collection',
                        description: '',
                        maintainers: 'test',
                        email: 'test@example.com',
                        variants: [
                            {
                                query: JSON.stringify({ type: 'variantQuery', variantQuery: 'XEC*' }),
                                name: 'XEC',
                                description: '',
                                highlighted: false,
                            },
                            {
                                query: JSON.stringify({ type: 'variantQuery', variantQuery: 'bad query!' }),
                                name: 'Bad',
                                description: '',
                                highlighted: false,
                            },
                        ],
                    }),
                ),
            );
            lapisRouteMocker.mockPostQueryParse(
                { queries: ['XEC*', 'bad query!'] },
                {
                    data: [
                        {
                            type: 'success',
                            filter: { type: 'HasNucleotideMutation', sequenceName: 'main', position: 123 },
                        },
                        { type: 'failure', error: 'Unexpected token' },
                    ],
                },
            );

            const result = await fetchWasapPageData(
                config,
                {},
                { mode: WASAP_ANALYSIS_MODE.covSpectrumCollection, collectionId: 42 },
            );

            expect(result).toMatchObject({
                type: 'collection',
                invalidVariants: [{ name: 'Bad', error: expect.stringContaining('Parse error') }],
            });
        });

        test('throws when mode is not enabled', async () => {
            const disabledConfig = { ...baseConfigFields };

            await expect(
                fetchWasapPageData(
                    disabledConfig,
                    {},
                    { mode: WASAP_ANALYSIS_MODE.covSpectrumCollection, collectionId: 42 },
                ),
            ).rejects.toThrow("Cannot fetch data, 'covSpectrumCollection' mode is not enabled.");
        });

        test('throws when no collection is selected', async () => {
            await expect(
                fetchWasapPageData(
                    config,
                    {},
                    { mode: WASAP_ANALYSIS_MODE.covSpectrumCollection, collectionId: undefined },
                ),
            ).rejects.toThrow('No collection selected');
        });
    });

    describe('collection mode', () => {
        const config = {
            ...baseConfigFields,
            lapisBaseUrl: DUMMY_LAPIS_URL,
            collectionAnalysisModeEnabled: true as const,
            filterDefaults: {
                collection: { mode: WASAP_ANALYSIS_MODE.collection, collectionId: 1 },
            },
        };

        test('fetches collection from backend and builds queries for query-type variants', async () => {
            backendRouteMocker.mockGetCollection('1', {
                id: 1,
                name: 'Test Collection',
                ownedBy: 1,
                organism: 'sc2',
                description: null,
                variantCount: 2,
                tags: [],
                variants: [
                    {
                        type: 'query',
                        id: 1,
                        collectionId: 1,
                        name: 'JN.1',
                        description: null,
                        countQuery: 'JN.1*',
                        coverageQuery: null,
                    },
                    {
                        type: 'query',
                        id: 2,
                        collectionId: 1,
                        name: 'XEC',
                        description: 'XEC lineage',
                        countQuery: 'XEC*',
                        coverageQuery: null,
                    },
                ],
            });
            lapisRouteMocker.mockPostQueryParse(
                { queries: ['JN.1*', 'XEC*'] },
                {
                    data: [
                        {
                            type: 'success',
                            filter: { type: 'HasNucleotideMutation', sequenceName: 'main', position: 1 },
                        },
                        {
                            type: 'success',
                            filter: { type: 'HasNucleotideMutation', sequenceName: 'main', position: 2 },
                        },
                    ],
                },
            );

            const result = await fetchWasapPageData(
                config,
                {},
                { mode: WASAP_ANALYSIS_MODE.collection, collectionId: 1 },
            );

            expect(result).toEqual({
                type: 'collection',
                collection: {
                    id: 1,
                    title: 'Test Collection',
                    queries: [
                        {
                            displayLabel: 'JN.1',
                            description: undefined,
                            countQuery: 'JN.1*',
                            coverageQuery: '(JN.1*) or (not maybe(JN.1*))',
                        },
                        {
                            displayLabel: 'XEC',
                            description: 'XEC lineage',
                            countQuery: 'XEC*',
                            coverageQuery: '(XEC*) or (not maybe(XEC*))',
                        },
                    ],
                },
            });
        });

        test('builds query string from filterObject variant', async () => {
            backendRouteMocker.mockGetCollection('1', {
                id: 1,
                name: 'Filter Collection',
                ownedBy: 1,
                organism: 'sc2',
                description: null,
                variantCount: 1,
                tags: [],
                variants: [
                    {
                        type: 'filterObject',
                        id: 1,
                        collectionId: 1,
                        name: 'Variant',
                        description: null,
                        filterObject: { nucleotideMutations: ['A123T'], aminoAcidMutations: ['S:E484K'] },
                    },
                ],
                // filter object causes type issues unfortunately
            } as unknown as Collection);
            lapisRouteMocker.mockPostQueryParse(
                { queries: ['A123T & S:E484K'] },
                {
                    data: [
                        {
                            type: 'success',
                            filter: { type: 'HasNucleotideMutation', sequenceName: 'main', position: 123 },
                        },
                    ],
                },
            );

            const result = await fetchWasapPageData(
                config,
                {},
                { mode: WASAP_ANALYSIS_MODE.collection, collectionId: 1 },
            );

            expect(result).toEqual({
                type: 'collection',
                collection: {
                    id: 1,
                    title: 'Filter Collection',
                    queries: [
                        {
                            displayLabel: 'Variant',
                            description: undefined,
                            countQuery: 'A123T & S:E484K',
                            coverageQuery: '(A123T & S:E484K) or (not maybe(A123T & S:E484K))',
                        },
                    ],
                },
            });
        });

        test('builds query string from filterObject variant with a lineage field', async () => {
            backendRouteMocker.mockGetCollection('1', {
                id: 1,
                name: 'Filter Collection',
                ownedBy: 1,
                organism: 'sc2',
                description: null,
                variantCount: 1,
                tags: [],
                variants: [
                    {
                        type: 'filterObject',
                        id: 1,
                        collectionId: 1,
                        name: 'Variant',
                        description: null,
                        filterObject: { pangoLineage: 'JN.1', nucleotideMutations: ['A123T'] },
                    },
                ],
                // filter object causes type issues unfortunately
            } as unknown as Collection);
            lapisRouteMocker.mockPostQueryParse(
                { queries: ['pangoLineage=JN.1 & A123T'] },
                {
                    data: [
                        {
                            type: 'success',
                            filter: { type: 'HasNucleotideMutation', sequenceName: 'main', position: 123 },
                        },
                    ],
                },
            );

            const result = await fetchWasapPageData(
                config,
                {},
                { mode: WASAP_ANALYSIS_MODE.collection, collectionId: 1 },
            );

            expect(result).toEqual({
                type: 'collection',
                collection: {
                    id: 1,
                    title: 'Filter Collection',
                    queries: [
                        {
                            displayLabel: 'Variant',
                            description: undefined,
                            countQuery: 'pangoLineage=JN.1 & A123T',
                            coverageQuery: '(pangoLineage=JN.1 & A123T) or (not maybe(pangoLineage=JN.1 & A123T))',
                        },
                    ],
                },
            });
        });

        test('reports variants that fail query parsing as invalid', async () => {
            backendRouteMocker.mockGetCollection('1', {
                id: 1,
                name: 'Test Collection',
                ownedBy: 1,
                organism: 'sc2',
                description: null,
                variantCount: 2,
                tags: [],
                variants: [
                    {
                        type: 'query',
                        id: 1,
                        collectionId: 1,
                        name: 'Valid',
                        description: null,
                        countQuery: 'JN.1*',
                        coverageQuery: null,
                    },
                    {
                        type: 'query',
                        id: 2,
                        collectionId: 1,
                        name: 'Bad',
                        description: null,
                        countQuery: 'bad query!',
                        coverageQuery: null,
                    },
                ],
            } as unknown as Collection);
            lapisRouteMocker.mockPostQueryParse(
                { queries: ['JN.1*', 'bad query!'] },
                {
                    data: [
                        {
                            type: 'success',
                            filter: { type: 'HasNucleotideMutation', sequenceName: 'main', position: 123 },
                        },
                        { type: 'failure', error: 'Unexpected token' },
                    ],
                },
            );

            const result = await fetchWasapPageData(
                config,
                {},
                { mode: WASAP_ANALYSIS_MODE.collection, collectionId: 1 },
            );

            expect(result).toMatchObject({
                type: 'collection',
                invalidVariants: [{ name: 'Bad', error: expect.stringContaining('Parse error') }],
            });
        });

        test('reports empty filterObject variants as invalid', async () => {
            backendRouteMocker.mockGetCollection('1', {
                id: 1,
                name: 'Test Collection',
                ownedBy: 1,
                organism: 'sc2',
                description: null,
                variantCount: 1,
                tags: [],
                variants: [
                    {
                        type: 'filterObject',
                        id: 1,
                        collectionId: 1,
                        name: 'Empty',
                        description: null,
                        filterObject: {},
                    },
                ],
            } as unknown as Collection);
            lapisRouteMocker.mockPostQueryParse({ queries: [] }, { data: [] });

            const result = await fetchWasapPageData(
                config,
                {},
                { mode: WASAP_ANALYSIS_MODE.collection, collectionId: 1 },
            );

            expect(result).toMatchObject({
                type: 'collection',
                invalidVariants: [{ name: 'Empty', error: 'Variant is empty.' }],
            });
        });

        test('deduplicates variant display labels', async () => {
            backendRouteMocker.mockGetCollection('1', {
                id: 1,
                name: 'Test Collection',
                ownedBy: 1,
                organism: 'sc2',
                description: null,
                variantCount: 2,
                tags: [],
                variants: [
                    {
                        type: 'query',
                        id: 1,
                        collectionId: 1,
                        name: 'Variant',
                        description: null,
                        countQuery: 'JN.1*',
                        coverageQuery: null,
                    },
                    {
                        type: 'query',
                        id: 2,
                        collectionId: 1,
                        name: 'Variant',
                        description: null,
                        countQuery: 'XEC*',
                        coverageQuery: null,
                    },
                ],
            } as unknown as Collection);
            lapisRouteMocker.mockPostQueryParse(
                { queries: ['JN.1*', 'XEC*'] },
                {
                    data: [
                        {
                            type: 'success',
                            filter: { type: 'HasNucleotideMutation', sequenceName: 'main', position: 1 },
                        },
                        {
                            type: 'success',
                            filter: { type: 'HasNucleotideMutation', sequenceName: 'main', position: 2 },
                        },
                    ],
                },
            );

            const result = await fetchWasapPageData(
                config,
                {},
                { mode: WASAP_ANALYSIS_MODE.collection, collectionId: 1 },
            );

            expect(result).toEqual({
                type: 'collection',
                collection: {
                    id: 1,
                    title: 'Test Collection',
                    queries: [
                        {
                            displayLabel: 'Variant',
                            description: undefined,
                            countQuery: 'JN.1*',
                            coverageQuery: '(JN.1*) or (not maybe(JN.1*))',
                        },
                        {
                            displayLabel: 'Variant (2)',
                            description: undefined,
                            countQuery: 'XEC*',
                            coverageQuery: '(XEC*) or (not maybe(XEC*))',
                        },
                    ],
                },
            });
        });

        test('throws when mode is not enabled', async () => {
            const disabledConfig = { ...baseConfigFields };

            await expect(
                fetchWasapPageData(disabledConfig, {}, { mode: WASAP_ANALYSIS_MODE.collection, collectionId: 1 }),
            ).rejects.toThrow("Cannot fetch data, 'collection' mode is not enabled.");
        });

        test('throws when no collection is selected', async () => {
            await expect(
                fetchWasapPageData(config, {}, { mode: WASAP_ANALYSIS_MODE.collection, collectionId: undefined }),
            ).rejects.toThrow('No collection selected');
        });
    });
});

describe('getLapisFilterForTimeFrame', () => {
    test('"all" returns an empty filter', () => {
        expect(getLapisFilterForTimeFrame(VARIANT_TIME_FRAME.all, 'date')).toEqual({});
    });

    test('"6months" returns a dateFrom filter using the given field name', () => {
        const result = getLapisFilterForTimeFrame(VARIANT_TIME_FRAME.sixMonths, 'collectionDate');

        expect(result).toEqual({ collectionDateFrom: dayjs().subtract(6, 'month').format('YYYY-MM-DD') });
    });

    test('"3months" returns a dateFrom filter using the given field name', () => {
        const result = getLapisFilterForTimeFrame(VARIANT_TIME_FRAME.threeMonths, 'date');

        expect(result).toEqual({ dateFrom: dayjs().subtract(3, 'month').format('YYYY-MM-DD') });
    });
});
