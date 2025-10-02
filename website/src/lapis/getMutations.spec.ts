import { beforeEach, describe, expect, test } from 'vitest';

import { getMutations } from './getMutations.ts';
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
