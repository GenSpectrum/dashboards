import { http } from 'msw';
import { beforeEach, describe, expect, test } from 'vitest';

import { getCollection } from './getCollection.ts';
import { type Collection } from './types.ts';
import { astroApiRouteMocker, testServer } from '../../vitest.setup.ts';

const DUMMY_COV_SPECTRUM_URL = 'http://cov-spectrum.dummy/api/v2';

describe('getCollection', () => {
    beforeEach(() => {
        astroApiRouteMocker.mockLog();
    });

    test('should successfully fetch a single collection by id', async () => {
        const mockCollection: Collection = {
            id: 1,
            title: "Editor's choice",
            description: 'A curated collection',
            maintainers: 'Test Team',
            email: 'test@example.com',
            variants: [
                {
                    query: '{"pangoLineage":"JN.1*"}',
                    name: 'JN.1*',
                    description: 'JN.1 variant',
                    highlighted: false,
                },
            ],
        };

        testServer.use(
            http.get(`${DUMMY_COV_SPECTRUM_URL}/resource/collection/1`, () => {
                return Response.json(mockCollection);
            }),
        );

        const result = await getCollection(DUMMY_COV_SPECTRUM_URL, 1);

        expect(result.id).equals(1);
        expect(result.title).equals("Editor's choice");
        expect(result.variants).toHaveLength(1);
        expect(result.variants[0].name).equals('JN.1*');
    });

    test('should construct the correct endpoint URL', async () => {
        const baseUrl = 'https://example.com/api/v2';
        const collectionId = 42;
        let requestedUrl = '';

        const mockCollection: Collection = {
            id: collectionId,
            title: 'Test Collection',
            description: 'Test description',
            maintainers: 'Tester',
            email: 'test@test.com',
            variants: [],
        };

        testServer.use(
            http.get(`${baseUrl}/resource/collection/${collectionId}`, ({ request }) => {
                requestedUrl = request.url;
                return Response.json(mockCollection);
            }),
        );

        await getCollection(baseUrl, collectionId);

        expect(requestedUrl).equals(`${baseUrl}/resource/collection/${collectionId}`);
    });

    test('should validate collection structure with all required fields', async () => {
        const mockCollection: Collection = {
            id: 2,
            title: 'Full Collection',
            description: 'Complete collection with all fields',
            maintainers: 'Team A, Team B',
            email: 'teams@example.com',
            variants: [
                {
                    query: '{"aaMutations":["S:L441R"]}',
                    name: 'S:L441R',
                    description: 'Spike mutation',
                    highlighted: true,
                },
                {
                    query: '{"nextcladePangoLineage":"XEC*"}',
                    name: 'XEC*',
                    description: 'XEC lineage',
                    highlighted: false,
                },
            ],
        };

        testServer.use(
            http.get(`${DUMMY_COV_SPECTRUM_URL}/resource/collection/2`, () => {
                return Response.json(mockCollection);
            }),
        );

        const result = await getCollection(DUMMY_COV_SPECTRUM_URL, 2);

        expect(result.id).equals(2);
        expect(result.title).equals('Full Collection');
        expect(result.description).equals('Complete collection with all fields');
        expect(result.maintainers).equals('Team A, Team B');
        expect(result.email).equals('teams@example.com');
        expect(result.variants).toHaveLength(2);
        expect(result.variants[0].highlighted).equals(true);
        expect(result.variants[1].highlighted).equals(false);
    });

    test('should throw error when request fails with 404', async () => {
        testServer.use(
            http.get(`${DUMMY_COV_SPECTRUM_URL}/resource/collection/999`, () => {
                return new Response(null, { status: 404 });
            }),
        );

        await expect(getCollection(DUMMY_COV_SPECTRUM_URL, 999)).rejects.toThrow(/Failed to fetch collection 999/);
    });

    test('should throw error when request fails with 500', async () => {
        testServer.use(
            http.get(`${DUMMY_COV_SPECTRUM_URL}/resource/collection/1`, () => {
                return new Response(null, { status: 500 });
            }),
        );

        await expect(getCollection(DUMMY_COV_SPECTRUM_URL, 1)).rejects.toThrow(/Failed to fetch collection 1/);
    });

    test('should throw error when response validation fails', async () => {
        const invalidData = {
            id: 'not-a-number', // Invalid: should be number
            title: 'Collection',
            description: 'Description',
            maintainers: 'Maintainer',
            email: 'email@example.com',
            variants: [],
        };

        testServer.use(
            http.get(`${DUMMY_COV_SPECTRUM_URL}/resource/collection/1`, () => {
                return Response.json(invalidData);
            }),
        );

        await expect(getCollection(DUMMY_COV_SPECTRUM_URL, 1)).rejects.toThrow(/Failed to parse collection 1 response/);
    });

    test('should throw error when missing required fields', async () => {
        const invalidData = {
            id: 1,
            title: 'Collection',
            // Missing description, maintainers, email, variants
        };

        testServer.use(
            http.get(`${DUMMY_COV_SPECTRUM_URL}/resource/collection/1`, () => {
                return Response.json(invalidData);
            }),
        );

        await expect(getCollection(DUMMY_COV_SPECTRUM_URL, 1)).rejects.toThrow(/Failed to parse collection 1 response/);
    });
});
