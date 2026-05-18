import { describe, expect, it } from 'vitest';

import { buildResistanceData } from './resistanceData.ts';
import type { Collection } from '../../../types/Collection.ts';

const setConfig = {
    collectionId: 1,
    name: 'fooBar',
    description: 'Main protease inhibitors',
    annotationSymbol: 'R',
};

const collection = {
    id: 1,
    name: 'fooBar',
    ownedBy: 'test',
    organism: 'sc2',
    description: null,
    variants: [
        {
            type: 'filterObject' as const,
            name: 'Nirmatrelvir resistant',
            filterObject: { aminoAcidMutations: ['S:E484K', 'S:N501Y'], foo: 'bar' },
        },
        {
            type: 'query' as const,
            name: 'ignored query variant',
            countQuery: 'some query',
        },
    ],
} as unknown as Collection;

describe('buildResistanceData', () => {
    it('maps filterObject variants to displayMutationsBySet and mutationAnnotations', () => {
        const result = buildResistanceData([setConfig], [collection]);

        expect(result.displayMutationsBySet).toEqual({
            fooBar: ['S:E484K', 'S:N501Y'],
        });

        expect(result.mutationAnnotations).toEqual([
            {
                name: 'Nirmatrelvir resistant',
                symbol: 'R',
                description: 'Main protease inhibitors',
                aminoAcidMutations: ['S:E484K'],
            },
            {
                name: 'Nirmatrelvir resistant',
                symbol: 'R',
                description: 'Main protease inhibitors',
                aminoAcidMutations: ['S:N501Y'],
            },
        ]);
    });

    it('skips query variants', () => {
        const result = buildResistanceData([setConfig], [collection]);

        const names = result.mutationAnnotations.map((a) => a.name);
        expect(names).not.toContain('ignored query variant');
    });

    it('returns empty results for empty inputs', () => {
        const result = buildResistanceData([], []);

        expect(result.mutationAnnotations).toEqual([]);
        expect(result.displayMutationsBySet).toEqual({});
    });
});
