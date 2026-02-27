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
    });

    test('should validate has mutation expression', () => {
        const expression: SiloFilterExpression = {
            type: 'HasNucleotideMutation',
            sequenceName: 'main',
            position: 501,
        };

        const result = validateGenomeOnly(expression);

        expect(result.isGenomeOnly).toBe(true);
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
    });

    test('should reject non-genome expression', () => {
        const expression: SiloFilterExpression = {
            type: 'StringEquals',
            column: 'country',
            value: 'USA',
        };

        const result = validateGenomeOnly(expression);

        expect(result.isGenomeOnly).toBe(false);
        if (!result.isGenomeOnly) {
            expect(result.error).toContain('StringEquals');
        }
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
    });

    test('should validate Or expression with genome checks', () => {
        const expression: SiloFilterExpression = {
            type: 'Or',
            children: [
                {
                    type: 'NucleotideEquals',
                    sequenceName: 'main',
                    position: 123,
                    symbol: 'A',
                },
                {
                    type: 'NucleotideEquals',
                    sequenceName: 'main',
                    position: 456,
                    symbol: 'T',
                },
            ],
        };

        const result = validateGenomeOnly(expression);

        expect(result.isGenomeOnly).toBe(true);
    });

    test('should validate Not expression with genome check', () => {
        const expression: SiloFilterExpression = {
            type: 'Not',
            child: {
                type: 'AminoAcidEquals',
                sequenceName: 'S',
                position: 484,
                symbol: 'K',
            },
        };

        const result = validateGenomeOnly(expression);

        expect(result.isGenomeOnly).toBe(true);
    });

    test('should validate Maybe expression with genome check', () => {
        const expression: SiloFilterExpression = {
            type: 'Maybe',
            child: {
                type: 'HasNucleotideMutation',
                sequenceName: 'main',
                position: 501,
            },
        };

        const result = validateGenomeOnly(expression);

        expect(result.isGenomeOnly).toBe(true);
    });

    test('should validate N-Of expression with genome checks', () => {
        const expression: SiloFilterExpression = {
            type: 'N-Of',
            numberOfMatchers: 2,
            matchExactly: false,
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
                {
                    type: 'InsertionContains',
                    position: 22204,
                    value: 'GAGCCAGAA',
                    sequenceName: 'main',
                },
            ],
        };

        const result = validateGenomeOnly(expression);

        expect(result.isGenomeOnly).toBe(true);
    });

    test('should validate True expression', () => {
        const expression: SiloFilterExpression = {
            type: 'True',
        };

        const result = validateGenomeOnly(expression);

        expect(result.isGenomeOnly).toBe(true);
    });

    test('should reject Or expression with non-genome check', () => {
        const expression: SiloFilterExpression = {
            type: 'Or',
            children: [
                {
                    type: 'NucleotideEquals',
                    sequenceName: 'main',
                    position: 123,
                    symbol: 'A',
                },
                {
                    type: 'StringEquals',
                    column: 'country',
                    value: 'USA',
                },
            ],
        };

        const result = validateGenomeOnly(expression);

        expect(result.isGenomeOnly).toBe(false);
        if (!result.isGenomeOnly) {
            expect(result.error).toContain('StringEquals');
        }
    });

    test('should reject Not expression with non-genome check', () => {
        const expression: SiloFilterExpression = {
            type: 'Not',
            child: {
                type: 'DateBetween',
                column: 'date',
                from: '2021-01-01',
                to: '2021-12-31',
            },
        };

        const result = validateGenomeOnly(expression);

        expect(result.isGenomeOnly).toBe(false);
        if (!result.isGenomeOnly) {
            expect(result.error).toContain('DateBetween');
        }
    });

    test('should validate nested complex expression with only genome checks', () => {
        const expression: SiloFilterExpression = {
            type: 'And',
            children: [
                {
                    type: 'Or',
                    children: [
                        {
                            type: 'NucleotideEquals',
                            sequenceName: 'main',
                            position: 123,
                            symbol: 'A',
                        },
                        {
                            type: 'NucleotideEquals',
                            sequenceName: 'main',
                            position: 123,
                            symbol: 'T',
                        },
                    ],
                },
                {
                    type: 'Maybe',
                    child: {
                        type: 'Not',
                        child: {
                            type: 'AminoAcidEquals',
                            sequenceName: 'S',
                            position: 484,
                            symbol: 'K',
                        },
                    },
                },
                {
                    type: 'N-Of',
                    numberOfMatchers: 1,
                    matchExactly: false,
                    children: [
                        {
                            type: 'InsertionContains',
                            position: 22204,
                            value: 'GAGCCAGAA',
                            sequenceName: 'main',
                        },
                        {
                            type: 'HasAminoAcidMutation',
                            sequenceName: 'S',
                            position: 501,
                        },
                    ],
                },
            ],
        };

        const result = validateGenomeOnly(expression);

        expect(result.isGenomeOnly).toBe(true);
    });

    test('should reject nested complex expression with non-genome checks', () => {
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
                    type: 'Or',
                    children: [
                        {
                            type: 'AminoAcidEquals',
                            sequenceName: 'S',
                            position: 484,
                            symbol: 'K',
                        },
                        {
                            type: 'StringEquals',
                            column: 'country',
                            value: 'USA',
                        },
                    ],
                },
            ],
        };

        const result = validateGenomeOnly(expression);

        expect(result.isGenomeOnly).toBe(false);
        if (!result.isGenomeOnly) {
            expect(result.error).toContain('StringEquals');
        }
    });

    test('should list multiple non-genome types in error', () => {
        const expression: SiloFilterExpression = {
            type: 'And',
            children: [
                {
                    type: 'StringEquals',
                    column: 'country',
                    value: 'USA',
                },
                {
                    type: 'DateBetween',
                    column: 'date',
                    from: '2021-01-01',
                    to: '2021-12-31',
                },
                {
                    type: 'IntEquals',
                    column: 'age',
                    value: 42,
                },
                {
                    type: 'NucleotideEquals',
                    sequenceName: 'main',
                    position: 123,
                    symbol: 'A',
                },
            ],
        };

        const result = validateGenomeOnly(expression);

        expect(result.isGenomeOnly).toBe(false);
        if (!result.isGenomeOnly) {
            expect(result.error).toContain('StringEquals');
            expect(result.error).toContain('DateBetween');
            expect(result.error).toContain('IntEquals');
        }
    });
});
