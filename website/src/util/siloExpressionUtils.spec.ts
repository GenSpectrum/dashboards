import { describe, expect, test } from 'vitest';

import { validateGenomeOnly } from './siloExpressionUtils.ts';
import type { SiloFilterExpression } from '../lapis/siloFilterExpression.ts';

describe('validateGenomeOnly', () => {
    test('should validate simple nucleotide equals expression', () => {
        const expression: SiloFilterExpression = {
            type: 'NucleotideEquals',
            sequenceName: 'main',
            position: 123,
            symbol: 'A',
        };

        const result = validateGenomeOnly(expression);

        expect(result.isGenomeOnly).toBe(true);
        expect(result.error).toBeUndefined();
    });

    test('should validate amino acid equals expression', () => {
        const expression: SiloFilterExpression = {
            type: 'AminoAcidEquals',
            sequenceName: 'S',
            position: 484,
            symbol: 'K',
        };

        const result = validateGenomeOnly(expression);

        expect(result.isGenomeOnly).toBe(true);
        expect(result.error).toBeUndefined();
    });

    test('should validate has mutation expression', () => {
        const expression: SiloFilterExpression = {
            type: 'HasNucleotideMutation',
            sequenceName: 'main',
            position: 501,
        };

        const result = validateGenomeOnly(expression);

        expect(result.isGenomeOnly).toBe(true);
        expect(result.error).toBeUndefined();
    });

    test('should validate insertion contains expression', () => {
        const expression: SiloFilterExpression = {
            type: 'InsertionContains',
            position: 22204,
            value: 'GAGCCAGAA',
            sequenceName: 'main',
        };

        const result = validateGenomeOnly(expression);

        expect(result.isGenomeOnly).toBe(true);
        expect(result.error).toBeUndefined();
    });

    test('should reject non-genome expression', () => {
        const expression: SiloFilterExpression = {
            type: 'StringEquals',
            column: 'country',
            value: 'USA',
        };

        const result = validateGenomeOnly(expression);

        expect(result.isGenomeOnly).toBe(false);
        expect(result.error).toContain('StringEquals');
    });

    test('should validate And expression with genome checks', () => {
        const expression: SiloFilterExpression = {
            type: 'And',
            children: [
                {
                    type: 'NucleotideEquals',
                    sequenceName: 'main',
                    position: 123,
                    symbol: 'A',
                },
                {
                    type: 'AminoAcidEquals',
                    sequenceName: 'S',
                    position: 484,
                    symbol: 'K',
                },
            ],
        };

        const result = validateGenomeOnly(expression);

        expect(result.isGenomeOnly).toBe(true);
        expect(result.error).toBeUndefined();
    });
});
