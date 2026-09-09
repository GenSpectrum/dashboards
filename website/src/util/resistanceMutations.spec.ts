import { describe, expect, it } from 'vitest';

import { buildMutationAnnotations } from './resistanceMutations.ts';
import type { Collection } from '../types/Collection.ts';

describe('buildMutationAnnotations', () => {
    it('returns empty array for empty inputs', () => {
        expect(buildMutationAnnotations([], [])).toEqual([]);
    });

    it('maps annotationSymbol to symbol and preserves name and description', () => {
        const config = { collectionId: 1, name: 'Spike', description: 'spike desc', annotationSymbol: 's' };
        const collection = {
            id: 1,
            name: 'Spike',
            variants: [
                {
                    type: 'filterObject',
                    name: 'v1',
                    filterObject: { aminoAcidMutations: ['S:E484K'] },
                },
            ],
        } as unknown as Collection;

        const [annotation] = buildMutationAnnotations([config], [collection]);

        expect(annotation.name).toBe('Spike');
        expect(annotation.symbol).toBe('s');
        expect(annotation.description).toBe('spike desc');
    });

    it('excludes query-type variants', () => {
        const config = { collectionId: 1, name: 'Set', description: '', annotationSymbol: 'x' };
        const collection = {
            id: 1,
            name: 'Set',
            variants: [
                { type: 'query', name: 'ignored', countQuery: 'q' },
                { type: 'filterObject', name: 'included', filterObject: { aminoAcidMutations: ['S:E484K'] } },
            ],
        } as unknown as Collection;

        const [annotation] = buildMutationAnnotations([config], [collection]);

        expect(annotation.aminoAcidMutations).toEqual([{ mutation: 'S:E484K', name: 'included' }]);
    });

    it('treats missing aminoAcidMutations as empty', () => {
        const config = { collectionId: 1, name: 'Set', description: '', annotationSymbol: 'x' };
        const collection = {
            id: 1,
            name: 'Set',
            variants: [
                { type: 'filterObject', name: 'no-mutations', filterObject: {} },
                { type: 'filterObject', name: 'has-mutation', filterObject: { aminoAcidMutations: ['S:N501Y'] } },
            ],
        } as unknown as Collection;

        const [annotation] = buildMutationAnnotations([config], [collection]);

        expect(annotation.aminoAcidMutations).toEqual([{ mutation: 'S:N501Y', name: 'has-mutation' }]);
    });

    it('builds one annotation per config, preserving order', () => {
        const configs = [
            { collectionId: 1, name: '3CLpro', description: 'protease', annotationSymbol: 'c' },
            { collectionId: 2, name: 'Spike', description: 'spike', annotationSymbol: 's' },
        ];
        const collections = [
            { id: 1, name: '3CLpro', variants: [] } as unknown as Collection,
            { id: 2, name: 'Spike', variants: [] } as unknown as Collection,
        ];

        const annotations = buildMutationAnnotations(configs, collections);

        expect(annotations).toHaveLength(2);
        expect(annotations[0].name).toBe('3CLpro');
        expect(annotations[1].name).toBe('Spike');
    });
});
