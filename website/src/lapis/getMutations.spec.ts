import { beforeEach, describe, expect, test } from 'vitest';

import { getMutations, getMutationsForVariant } from './getMutations.ts';
import { DUMMY_LAPIS_URL } from '../../routeMocker.ts';
import { astroApiRouteMocker, lapisRouteMocker } from '../../vitest.setup.ts';

describe('getMutations', () => {
    beforeEach(() => {
        astroApiRouteMocker.mockLog();
    });

    test('should return filtered mutations', async () => {
        lapisRouteMocker.mockPostNucleotideMutations(
            { minProportion: 0.1, pangoLineage: 'B.1.1.7' },
            {
                data: [
                    { mutation: 'A123C', count: 5 },
                    { mutation: 'G234T', count: 2 },
                ],
            },
        );

        const result = await getMutations(DUMMY_LAPIS_URL, 'nucleotide', 'B.1.1.7', 0.1, 3);

        expect(result).toEqual(['A123C']);
    });

    test('should return filtered mutations without lineage', async () => {
        lapisRouteMocker.mockPostNucleotideMutations(
            { minProportion: 0 },
            {
                data: [
                    { mutation: 'A123C', count: 58 },
                    { mutation: 'G234T', count: 223 },
                ],
            },
        );

        const result = await getMutations(DUMMY_LAPIS_URL, 'nucleotide', undefined, 0, 3);

        expect(result).toEqual(['A123C', 'G234T']);
    });

    test('should throw on failed request', async () => {
        lapisRouteMocker.mockPostNucleotideMutations(
            { minProportion: 0.1 },
            { data: [{ mutation: 'A123C', count: 5 }] },
            500,
        );

        await expect(getMutations(DUMMY_LAPIS_URL, 'nucleotide', undefined, 0.1, 1)).rejects.toThrow(
            /Failed to fetch mutations/,
        );
    });

    test('should throw on unexpected response', async () => {
        // @ts-expect-error wrong shape
        lapisRouteMocker.mockPostNucleotideMutations({ minProportion: 0.1 }, { data: 'invalid' });

        await expect(getMutations(DUMMY_LAPIS_URL, 'nucleotide', undefined, 0.1, 1)).rejects.toThrow(
            /Failed to parse mutations response/,
        );
    });
});

describe('getMutationsForVariant', () => {
    beforeEach(() => {
        astroApiRouteMocker.mockLog();
    });

    test('foo', async () => {
        lapisRouteMocker.mockPostAggregated({pangoLineage: 'FOO'}, { data: [{ count: 20 }] });
        lapisRouteMocker.mockPostNucleotideMutations(
            { minProportion: 0.1, pangoLineage: 'FOO' },
            {
                data: [
                    { mutation: 'A1C', count: 20 },
                    { mutation: 'A2C', count: 20 },
                    { mutation: 'A3C', count: 2 },
                ],
            },
        );
        lapisRouteMocker.mockPostNucleotideMutations(
            { minProportion: 0 },
            {
                data: [
                    { mutation: 'A1C', count: 40 },
                    { mutation: 'A2C', count: 20 },
                    { mutation: 'A3C', count: 2 },
                ],
            },
        );

        // TODO - the test is failing. I think, it is because the resolver is just matching the URL
        // and when the body doesn't match, we get a 400 error. it'd be great if instead, the resolver
        // would return undefined, and let the next matcher try.
        // If I'm reading this right, we generally can't have multiple responsesn for the same endpoint
        // with different params.

        const result = await getMutationsForVariant(DUMMY_LAPIS_URL, 'nucleotide', 'FOO', 0.1, 5, 0.9);

        expect(result).toEqual(['A2C']);
    })
})
