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

    test('should filter mutations by Jaccard index', async () => {
        // Setup:
        // - Variant FOO has 20 sequences
        // - A1C: in 20 FOO sequences, 40 total -> Jaccard = 20/(20+40-20) = 20/40 = 0.5 (excluded, < 0.9)
        // - A2C: in 20 FOO sequences, 20 total -> Jaccard = 20/(20+20-20) = 20/20 = 1.0 (included, >= 0.9)
        // - A3C: in 2 FOO sequences (excluded by minCount < 5)
        lapisRouteMocker.mockPostAggregated({ pangoLineage: 'FOO' }, { data: [{ count: 20 }] });
        lapisRouteMocker.mockPostNucleotideMutationsMulti([
            {
                body: { minProportion: 0.1, pangoLineage: 'FOO' },
                response: {
                    data: [
                        { mutation: 'A1C', count: 20 },
                        { mutation: 'A2C', count: 20 },
                        { mutation: 'A3C', count: 2 },
                    ],
                },
            },
            {
                body: { minProportion: 0 },
                response: {
                    data: [
                        { mutation: 'A1C', count: 40 },
                        { mutation: 'A2C', count: 20 },
                        { mutation: 'A3C', count: 2 },
                    ],
                },
            },
        ]);

        const result = await getMutationsForVariant(DUMMY_LAPIS_URL, 'nucleotide', 'FOO', 0.1, 5, 0.9);

        expect(result).toEqual(['A2C']);
    });

    test('should include mutations with Jaccard index at threshold', async () => {
        // Setup:
        // - Variant BAR has 10 sequences
        // - T100C: in 10 BAR sequences, 15 total -> Jaccard = 10/(10+15-10) = 10/15 = 0.667 (included, >= 0.6)
        lapisRouteMocker.mockPostAggregated({ pangoLineage: 'BAR' }, { data: [{ count: 10 }] });
        lapisRouteMocker.mockPostNucleotideMutationsMulti([
            {
                body: { minProportion: 0.05, pangoLineage: 'BAR' },
                response: {
                    data: [{ mutation: 'T100C', count: 10 }],
                },
            },
            {
                body: { minProportion: 0 },
                response: {
                    data: [{ mutation: 'T100C', count: 15 }],
                },
            },
        ]);

        const result = await getMutationsForVariant(DUMMY_LAPIS_URL, 'nucleotide', 'BAR', 0.05, 5, 0.6);

        expect(result).toEqual(['T100C']);
    });

    test('should filter by minCount before Jaccard index', async () => {
        // Setup:
        // - Variant BAZ has 100 sequences
        // - G500T: in 3 BAZ sequences, 3 total -> Jaccard = 3/(100+3-3) = 3/100 = 0.03 (excluded by minCount)
        lapisRouteMocker.mockPostAggregated({ pangoLineage: 'BAZ' }, { data: [{ count: 100 }] });
        lapisRouteMocker.mockPostNucleotideMutationsMulti([
            {
                body: { minProportion: 0.01, pangoLineage: 'BAZ' },
                response: {
                    data: [{ mutation: 'G500T', count: 3 }],
                },
            },
            {
                body: { minProportion: 0 },
                response: {
                    data: [{ mutation: 'G500T', count: 3 }],
                },
            },
        ]);

        const result = await getMutationsForVariant(DUMMY_LAPIS_URL, 'nucleotide', 'BAZ', 0.01, 5, 0.01);

        expect(result).toEqual([]);
    });

    test('should handle multiple mutations passing all filters', async () => {
        // Setup:
        // - Variant QUX has 50 sequences
        // - C200T: in 45 QUX, 50 total -> Jaccard = 45/(50+50-45) = 45/55 = 0.818 (included)
        // - A300G: in 48 QUX, 60 total -> Jaccard = 48/(50+60-48) = 48/62 = 0.774 (included)
        // - T400C: in 50 QUX, 50 total -> Jaccard = 50/(50+50-50) = 50/50 = 1.0 (included)
        lapisRouteMocker.mockPostAggregated({ pangoLineage: 'QUX' }, { data: [{ count: 50 }] });
        lapisRouteMocker.mockPostNucleotideMutationsMulti([
            {
                body: { minProportion: 0.05, pangoLineage: 'QUX' },
                response: {
                    data: [
                        { mutation: 'C200T', count: 45 },
                        { mutation: 'A300G', count: 48 },
                        { mutation: 'T400C', count: 50 },
                    ],
                },
            },
            {
                body: { minProportion: 0 },
                response: {
                    data: [
                        { mutation: 'C200T', count: 50 },
                        { mutation: 'A300G', count: 60 },
                        { mutation: 'T400C', count: 50 },
                    ],
                },
            },
        ]);

        const result = await getMutationsForVariant(DUMMY_LAPIS_URL, 'nucleotide', 'QUX', 0.05, 5, 0.75);

        expect(result).toEqual(['C200T', 'A300G', 'T400C']);
    });

    test('should work with amino acid mutations', async () => {
        // Setup:
        // - Variant DELTA has 30 sequences
        // - S:L452R: in 30 DELTA sequences, 30 total -> Jaccard = 30/(30+30-30) = 30/30 = 1.0 (included)
        lapisRouteMocker.mockPostAggregated({ pangoLineage: 'DELTA' }, { data: [{ count: 30 }] });
        lapisRouteMocker.mockPostAminoAcidMutationsMulti([
            {
                body: { minProportion: 0.05, pangoLineage: 'DELTA' },
                response: {
                    data: [{ mutation: 'S:L452R', count: 30 }],
                },
            },
            {
                body: { minProportion: 0 },
                response: {
                    data: [{ mutation: 'S:L452R', count: 30 }],
                },
            },
        ]);

        const result = await getMutationsForVariant(DUMMY_LAPIS_URL, 'amino acid', 'DELTA', 0.05, 5, 0.9);

        expect(result).toEqual(['S:L452R']);
    });
});
