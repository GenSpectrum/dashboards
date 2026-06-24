import { describe, expect, it } from 'vitest';

import { buildResistanceData } from './resistanceData.ts';
import type { Collection } from '../../../types/Collection.ts';

describe('buildResistanceData', () => {
    it('returns empty results for empty inputs', () => {
        const result = buildResistanceData([], []);

        expect(result.mutationAnnotations).toEqual([]);
        expect(result.displayMutationsBySet).toEqual({});
    });

    it('creates one annotation per collection with per-mutation names from variants, skipping query variants', () => {
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

        const result = buildResistanceData([setConfig], [collection]);

        expect(result.displayMutationsBySet).toEqual({
            fooBar: ['S:E484K', 'S:N501Y'],
        });
        expect(result.mutationAnnotations).toEqual([
            {
                name: 'fooBar',
                symbol: 'R',
                description: 'Main protease inhibitors',
                aminoAcidMutations: [
                    { mutation: 'S:E484K', name: 'fooBar:1' },
                    { mutation: 'S:N501Y', name: 'fooBar:23' },
                ],
            },
        ]);
    });
});
