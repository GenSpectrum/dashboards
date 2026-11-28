import { expect, test } from 'vitest';

import { readOptionalText, readText, RhydbRowError } from './row.ts';

const row = { sampleId: 'S1', sym: null, n: 8120 };

test('text must be present and not null', () => {
    expect(readText(row, 'sampleId')).toBe('S1');
    expect(() => readText(row, 'sym')).toThrow(RhydbRowError);
    expect(() => readText(row, 'missing')).toThrow(RhydbRowError);
});

test('null is data, a number is read as text, and an absent column is a mistake', () => {
    expect(readOptionalText(row, 'sym')).toBeNull();
    expect(readOptionalText(row, 'sampleId')).toBe('S1');
    expect(readOptionalText(row, 'n')).toBe('8120');
    expect(() => readOptionalText(row, 'missing')).toThrow(RhydbRowError);
});

test('the error names the column, which is what a mismatch between a query and the code using its rows needs', () => {
    expect(() => readText(row, 'reads')).toThrow('Column "reads": expected text, got no such column');
});
