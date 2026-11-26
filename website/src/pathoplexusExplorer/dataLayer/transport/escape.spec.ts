import { describe, expect, test } from 'vitest';

import { canQuote, identifier, positiveInt, proportion, stringLiteral, stringLiteralSet } from './escape.ts';

describe('stringLiteral', () => {
    test('quotes plain strings', () => {
        expect(stringLiteral('Zürich (ZH)')).toBe("'Zürich (ZH)'");
    });

    test('doubles single quotes', () => {
        expect(stringLiteral("it's")).toBe("'it''s'");
        expect(stringLiteral("'; drop --")).toBe("'''; drop --'");
    });

    test('rejects control characters', () => {
        expect(() => stringLiteral('a\nb')).toThrow();
        expect(() => stringLiteral('a\0b')).toThrow();
    });
});

test('canQuote tells in advance whether a value can be sent as a literal', () => {
    expect(canQuote("it's")).toBe(true);
    expect(canQuote('a\nb')).toBe(false);
    expect(canQuote('a\rb')).toBe(false);
    expect(canQuote('a\0b')).toBe(false);
});

describe('stringLiteralSet', () => {
    test('emits the brace form that in() takes', () => {
        expect(stringLiteralSet(['2026-07-01', '2026-07-02'])).toBe("{'2026-07-01', '2026-07-02'}");
    });

    test('escapes every member', () => {
        expect(stringLiteralSet(["it's"])).toBe("{'it''s'}");
    });

    test('rejects the empty set', () => {
        expect(() => stringLiteralSet([])).toThrow();
    });
});

describe('identifier', () => {
    test('passes plain identifiers through', () => {
        expect(identifier('samplingDate')).toBe('samplingDate');
        expect(identifier('_x9')).toBe('_x9');
    });

    test('quotes anything else', () => {
        expect(identifier('my column')).toBe('"my column"');
        expect(identifier('a"b')).toBe('"a""b"');
        expect(identifier('9lives')).toBe('"9lives"');
    });
});

describe('numbers', () => {
    test('positiveInt', () => {
        expect(positiveInt(23403)).toBe('23403');
        expect(() => positiveInt(1.5)).toThrow();
        expect(() => positiveInt(-1)).toThrow();
    });

    test('proportion', () => {
        expect(proportion(0.05)).toBe('0.05');
        expect(proportion(0)).toBe('0');
        expect(() => proportion(1.5)).toThrow();
        expect(() => proportion(NaN)).toThrow();
    });
});
