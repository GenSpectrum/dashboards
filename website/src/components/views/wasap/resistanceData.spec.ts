import { describe, expect, it } from 'vitest';

import { buildResistanceData } from './resistanceData.ts';
import type { Collection } from '../../../types/Collection.ts';

const setConfig = {
    collectionId: 1,
    name: 'fooBar',
    description: 'Main protease inhibitors',
    annotationSymbol: 'R',
    annotationMode: 'per-variant' as const,
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
            name: 'fooBar:1',
            filterObject: { aminoAcidMutations: ['S:E484K'] },
        },
        {
            type: 'filterObject' as const,
            name: 'fooBar:23',
            filterObject: { aminoAcidMutations: ['S:N501Y'] },
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
                name: 'fooBar:1',
                symbol: 'R',
                description: 'Main protease inhibitors',
                aminoAcidMutations: ['S:E484K'],
            },
            {
                name: 'fooBar:23',
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

describe('buildResistanceData per-collection mode', () => {
    const perCollectionSetConfig = {
        collectionId: 2,
        name: 'Nirsevimab',
        description: 'RSV resistance mutations against Nirsevimab',
        annotationSymbol: 'n',
        annotationMode: 'per-collection' as const,
    };

    const perCollectionCollection = {
        id: 2,
        name: 'Nirsevimab resistance mutations',
        ownedBy: 'test',
        organism: 'rsvA',
        description: null,
        variants: [
            {
                type: 'filterObject' as const,
                name: 'Resistance',
                filterObject: { aminoAcidMutations: ['F:N67I', 'F:N208Y'] },
            },
            {
                type: 'filterObject' as const,
                name: 'Partial resistance',
                filterObject: { aminoAcidMutations: ['F:K68N'] },
            },
            {
                type: 'query' as const,
                name: 'ignored query variant',
                countQuery: 'some query',
            },
        ],
    } as unknown as Collection;

    it('produces one annotation entry for the whole collection with all mutations flattened', () => {
        const result = buildResistanceData([perCollectionSetConfig], [perCollectionCollection]);

        expect(result.displayMutationsBySet).toEqual({
            Nirsevimab: ['F:N67I', 'F:N208Y', 'F:K68N'],
        });

        expect(result.mutationAnnotations).toEqual([
            {
                name: 'Nirsevimab',
                symbol: 'n',
                description: 'RSV resistance mutations against Nirsevimab',
                aminoAcidMutations: ['F:N67I', 'F:N208Y', 'F:K68N'],
            },
        ]);
    });

    it('skips query variants', () => {
        const result = buildResistanceData([perCollectionSetConfig], [perCollectionCollection]);

        expect(result.mutationAnnotations).toHaveLength(1);
        expect(result.mutationAnnotations[0].aminoAcidMutations).not.toContain('ignored query variant');
    });
});
