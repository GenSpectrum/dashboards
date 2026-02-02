import { http } from 'msw';
import { beforeEach, describe, expect, test } from 'vitest';

import { getCollections } from './getCollections.ts';
import { type CollectionRaw } from './types.ts';
import { astroApiRouteMocker, testServer } from '../../vitest.setup.ts';

const DUMMY_COV_SPECTRUM_URL = 'http://cov-spectrum.dummy/api/v2';

describe('getCollections', () => {
    beforeEach(() => {
        astroApiRouteMocker.mockLog();
    });

    test('should return collections sorted by id', async () => {
        const mockCollections: CollectionRaw[] = [
            {
                id: 3,
                title: 'Third Collection',
                description: 'Third collection description',
                maintainers: 'Test Maintainer',
                email: 'test@example.com',
                variants: [{ query: '{}', name: 'Variant C', description: 'Description C', highlighted: false }],
            },
            {
                id: 1,
                title: 'First Collection',
                description: 'First collection description',
                maintainers: 'Test Maintainer',
                email: 'test@example.com',
                variants: [{ query: '{}', name: 'Variant A', description: 'Description A', highlighted: false }],
            },
            {
                id: 2,
                title: 'Second Collection',
                description: 'Second collection description',
                maintainers: 'Test Maintainer',
                email: 'test@example.com',
                variants: [{ query: '{}', name: 'Variant B', description: 'Description B', highlighted: false }],
            },
        ];

        testServer.use(
            http.get(`${DUMMY_COV_SPECTRUM_URL}/resource/collection`, () => {
                return Response.json(mockCollections);
            }),
        );

        const result = await getCollections(DUMMY_COV_SPECTRUM_URL);

        expect(result).toHaveLength(3);
        expect(result[0].id).equals(1);
        expect(result[1].id).equals(2);
        expect(result[2].id).equals(3);
    });

    test('should return empty array when no collections exist', async () => {
        testServer.use(
            http.get(`${DUMMY_COV_SPECTRUM_URL}/resource/collection`, () => {
                return Response.json([]);
            }),
        );

        const result = await getCollections(DUMMY_COV_SPECTRUM_URL);

        expect(result).toEqual([]);
    });

    test('should throw error when request fails', async () => {
        testServer.use(
            http.get(`${DUMMY_COV_SPECTRUM_URL}/resource/collection`, () => {
                return new Response(null, { status: 500 });
            }),
        );

        await expect(getCollections(DUMMY_COV_SPECTRUM_URL)).rejects.toThrow(/Failed to fetch collections/);
    });

    test('should throw error when response validation fails', async () => {
        const invalidData = [
            {
                id: 'not-a-number', // Invalid: should be number
                title: 'Collection',
                description: 'Description',
                maintainers: 'Maintainer',
                email: 'email@example.com',
                variants: [],
            },
        ];

        testServer.use(
            http.get(`${DUMMY_COV_SPECTRUM_URL}/resource/collection`, () => {
                return Response.json(invalidData);
            }),
        );

        await expect(getCollections(DUMMY_COV_SPECTRUM_URL)).rejects.toThrow(/Failed to parse collections response/);
    });

    test('should correctly construct endpoint URL', async () => {
        const baseUrl = 'https://example.com/api/v2';
        let requestedUrl = '';

        testServer.use(
            http.get(`${baseUrl}/resource/collection`, ({ request }) => {
                requestedUrl = request.url;
                return Response.json([]);
            }),
        );

        await getCollections(baseUrl);

        expect(requestedUrl).equals(`${baseUrl}/resource/collection`);
    });

    test('should validate collection structure with variants', async () => {
        const mockCollections: CollectionRaw[] = [
            {
                id: 1,
                title: 'Test Collection',
                description: 'A test collection',
                maintainers: 'Test Team',
                email: 'test@example.com',
                variants: [
                    {
                        query: '{"pangoLineage":"BA.1"}',
                        name: 'BA.1',
                        description: 'Omicron BA.1',
                        highlighted: true,
                    },
                    {
                        query: '{"pangoLineage":"BA.2"}',
                        name: 'BA.2',
                        description: 'Omicron BA.2',
                        highlighted: false,
                    },
                ],
            },
        ];

        testServer.use(
            http.get(`${DUMMY_COV_SPECTRUM_URL}/resource/collection`, () => {
                return Response.json(mockCollections);
            }),
        );

        const result = await getCollections(DUMMY_COV_SPECTRUM_URL);

        expect(result).toHaveLength(1);
        expect(result[0].variants).toHaveLength(2);
        expect(result[0].variants[0].name).equals('BA.1');
        expect(result[0].variants[1].name).equals('BA.2');
    });
});
