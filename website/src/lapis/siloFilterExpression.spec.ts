import { describe, expect, test } from 'vitest';

import { siloFilterExpressionSchema } from './siloFilterExpression.ts';

describe('siloFilterExpressionSchema', () => {
    test('should parse StringEquals', () => {
        const data = {
            type: 'StringEquals',
            column: 'country',
            value: 'USA',
        };

        const result = siloFilterExpressionSchema.safeParse(data);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual(data);
        }
    });

    test('should parse NucleotideEquals', () => {
        const data = {
            type: 'NucleotideEquals',
            sequenceName: 'main',
            position: 123,
            symbol: 'A',
        };

        const result = siloFilterExpressionSchema.safeParse(data);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual(data);
        }
    });

    test('should parse DateBetween', () => {
        const data = {
            type: 'DateBetween',
            column: 'date',
            from: '2024-01-01',
            to: '2024-12-31',
        };

        const result = siloFilterExpressionSchema.safeParse(data);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual(data);
        }
    });

    test('should parse IntBetween', () => {
        const data = {
            type: 'IntBetween',
            column: 'age',
            from: 30,
            to: 50,
        };

        const result = siloFilterExpressionSchema.safeParse(data);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual(data);
        }
    });

    test('should parse And with children', () => {
        const data = {
            type: 'And',
            children: [
                {
                    type: 'StringEquals',
                    column: 'country',
                    value: 'USA',
                },
                {
                    type: 'IntBetween',
                    column: 'age',
                    from: 30,
                    to: 50,
                },
            ],
        };

        const result = siloFilterExpressionSchema.safeParse(data);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual(data);
        }
    });

    test('should parse Or with children', () => {
        const data = {
            type: 'Or',
            children: [
                {
                    type: 'StringEquals',
                    column: 'country',
                    value: 'USA',
                },
                {
                    type: 'StringEquals',
                    column: 'country',
                    value: 'Germany',
                },
            ],
        };

        const result = siloFilterExpressionSchema.safeParse(data);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual(data);
        }
    });

    test('should parse Not with child', () => {
        const data = {
            type: 'Not',
            child: {
                type: 'StringEquals',
                column: 'country',
                value: 'USA',
            },
        };

        const result = siloFilterExpressionSchema.safeParse(data);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual(data);
        }
    });

    test('should parse N-Of with children', () => {
        const data = {
            type: 'N-Of',
            numberOfMatchers: 2,
            matchExactly: false,
            children: [
                {
                    type: 'StringEquals',
                    column: 'country',
                    value: 'USA',
                },
                {
                    type: 'StringEquals',
                    column: 'country',
                    value: 'Germany',
                },
                {
                    type: 'StringEquals',
                    column: 'country',
                    value: 'France',
                },
            ],
        };

        const result = siloFilterExpressionSchema.safeParse(data);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual(data);
        }
    });

    test('should parse deeply nested expressions', () => {
        const data = {
            type: 'And',
            children: [
                {
                    type: 'Or',
                    children: [
                        {
                            type: 'StringEquals',
                            column: 'country',
                            value: 'USA',
                        },
                        {
                            type: 'StringEquals',
                            column: 'country',
                            value: 'Germany',
                        },
                    ],
                },
                {
                    type: 'Not',
                    child: {
                        type: 'DateBetween',
                        column: 'date',
                        from: null,
                        to: '2024-01-01',
                    },
                },
            ],
        };

        const result = siloFilterExpressionSchema.safeParse(data);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual(data);
        }
    });

    test('should reject invalid type', () => {
        const data = {
            type: 'InvalidType',
            column: 'country',
            value: 'USA',
        };

        const result = siloFilterExpressionSchema.safeParse(data);

        expect(result.success).toBe(false);
    });

    test('should reject missing required fields', () => {
        const data = {
            type: 'StringEquals',
            column: 'country',
            // missing 'value' field
        };

        const result = siloFilterExpressionSchema.safeParse(data);

        expect(result.success).toBe(false);
    });

    test('should accept nullable values', () => {
        const data = {
            type: 'StringEquals',
            column: 'country',
            value: null,
        };

        const result = siloFilterExpressionSchema.safeParse(data);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual(data);
        }
    });

    test('should parse True (no additional fields)', () => {
        const data = {
            type: 'True',
        };

        const result = siloFilterExpressionSchema.safeParse(data);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual(data);
        }
    });
});
