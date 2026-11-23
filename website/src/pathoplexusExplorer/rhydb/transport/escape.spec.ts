import { describe, expect, test } from 'vitest';

import { identifier, stringLiteral } from './escape.ts';

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
