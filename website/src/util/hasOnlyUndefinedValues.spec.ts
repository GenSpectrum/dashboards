import { describe } from 'vitest';

import { hasOnlyUndefinedValues } from './hasOnlyUndefinedValues.ts';

describe('hasOnlyUndefinedValues', (it) => {
    it('should return true if all values are undefined', ({ expect }) => {
        const obj = {
            a: undefined,
            b: {
                c: undefined,
                d: {
                    e: undefined,
                },
            },
        };
        expect(hasOnlyUndefinedValues(obj)).toBe(true);
    });

    it('should return false if any value is not undefined', ({ expect }) => {
        const obj = {
            a: undefined,
            b: {
                c: undefined,
                d: {
                    e: 'abc',
                },
            },
        };
        expect(hasOnlyUndefinedValues(obj)).toBe(false);
    });

    it('should return false if object contains null values', ({ expect }) => {
        expect(hasOnlyUndefinedValues({ test: null })).toBe(false);
    });
});
