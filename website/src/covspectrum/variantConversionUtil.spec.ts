import { describe, expect, test } from 'vitest';

import type { DetailedMutationsQuery } from './types';
import { detailedMutationsToQuery } from './variantConversionUtil';

describe('detailedMutationsToQuery', () => {
    test('should return empty string for empty query', () => {
        const query: DetailedMutationsQuery = {
            type: 'detailedMutations',
        };

        const result = detailedMutationsToQuery(query);

        expect(result).toBe('');
    });

    test('should convert nucleotide mutations only', () => {
        const query: DetailedMutationsQuery = {
            type: 'detailedMutations',
            nucMutations: ['A123T', 'C456G', 'G789A'],
        };

        const result = detailedMutationsToQuery(query);

        expect(result).toBe('A123T & C456G & G789A');
    });

    test('should convert pangoLineage filter', () => {
        const query: DetailedMutationsQuery = {
            type: 'detailedMutations',
            pangoLineage: 'BA.1',
        };

        const result = detailedMutationsToQuery(query);

        expect(result).toBe('pangoLineage=BA.1');
    });

    test('should convert nextcladePangoLineage filter', () => {
        const query: DetailedMutationsQuery = {
            type: 'detailedMutations',
            nextcladePangoLineage: 'C.1',
        };

        const result = detailedMutationsToQuery(query);

        expect(result).toBe('nextcladePangoLineage=C.1');
    });

    test('should combine lineage, mutations, and insertions', () => {
        const query: DetailedMutationsQuery = {
            type: 'detailedMutations',
            pangoLineage: 'BA.2',
            nucMutations: ['A123T'],
            aaMutations: ['S:N501Y'],
            nucInsertions: ['ins_22204:GAGCCAGAA'],
            aaInsertions: ['S:ins_214:EPE'],
        };

        const result = detailedMutationsToQuery(query);

        expect(result).toBe('pangoLineage=BA.2 & A123T & S:N501Y & ins_22204:GAGCCAGAA & S:ins_214:EPE');
    });

    test('should handle multiple mutations and both lineage types', () => {
        const query: DetailedMutationsQuery = {
            type: 'detailedMutations',
            pangoLineage: 'BA.1',
            nextcladePangoLineage: '21K',
            aaMutations: ['S:L452R', 'S:T478K'],
        };

        const result = detailedMutationsToQuery(query);

        expect(result).toBe('pangoLineage=BA.1 & nextcladePangoLineage=21K & S:L452R & S:T478K');
    });
});
