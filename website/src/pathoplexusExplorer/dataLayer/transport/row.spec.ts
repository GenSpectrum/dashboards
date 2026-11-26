import { describe, expect, test } from 'vitest';

import { readCount, readNumber, readOptionalText, readText, RhydbRowError } from './row.ts';

describe('reading a row', () => {
    const row = { sampleId: 'S1', sym: null, n: 8120, proportion: 0.05 };

    test('text, present and not null', () => {
        expect(readText(row, 'sampleId')).toBe('S1');
        expect(() => readText(row, 'sym')).toThrow(RhydbRowError);
        expect(() => readText(row, 'missing')).toThrow(RhydbRowError);
    });

    test('null is data, an absent column is a mistake', () => {
        expect(readOptionalText(row, 'sym')).toBeNull();
        expect(readOptionalText(row, 'sampleId')).toBe('S1');
        expect(readOptionalText({ symbol: 7 }, 'symbol')).toBe('7');
        expect(() => readOptionalText(row, 'missing')).toThrow(RhydbRowError);
    });

    test('counts are non-negative integers', () => {
        expect(readCount(row, 'n')).toBe(8120);
        expect(readCount({ n: 0 }, 'n')).toBe(0);
        expect(() => readCount({ n: -1 }, 'n')).toThrow(RhydbRowError);
        expect(() => readCount({ n: 1.5 }, 'n')).toThrow(RhydbRowError);
        expect(() => readCount({}, 'n')).toThrow(RhydbRowError);
    });

    test('numbers, including ones an encoder sent as text to keep their precision', () => {
        expect(readNumber(row, 'proportion')).toBe(0.05);
        expect(readNumber({ n: '8120' }, 'n')).toBe(8120);
        expect(() => readNumber({ n: 'many' }, 'n')).toThrow(RhydbRowError);
        expect(() => readNumber({ n: null }, 'n')).toThrow(RhydbRowError);
    });

    test('the error names the column, which is what a mismatch between a query and the code using its rows needs', () => {
        expect(() => readCount(row, 'reads')).toThrow(/"reads"/);
        expect(() => readCount(row, 'reads')).toThrow(/no such column/);
    });
});
