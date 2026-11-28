import { describe, expect, test } from 'vitest';

import { canQuote, identifier, stringLiteral } from './escape.ts';

describe('a string literal', () => {
    test('is quoted, with a quote inside it doubled', () => {
        expect(stringLiteral('Zürich (ZH)')).toBe("'Zürich (ZH)'");
        expect(stringLiteral("'; drop --")).toBe("'''; drop --'");
    });

    test('cannot hold a line break or a NUL character, which canQuote tells in advance', () => {
        for (const value of ['a\nb', 'a\rb', 'a\0b']) {
            expect(canQuote(value)).toBe(false);
            expect(() => stringLiteral(value)).toThrow();
        }
        expect(canQuote("it's")).toBe(true);
    });
});

describe('an identifier', () => {
    test('is passed through where it is a plain name', () => {
        expect(identifier('samplingDate')).toBe('samplingDate');
        expect(identifier('_x9')).toBe('_x9');
    });

    test('is double-quoted otherwise, with a double quote inside it doubled', () => {
        expect(identifier('my column')).toBe('"my column"');
        expect(identifier('a"b')).toBe('"a""b"');
        expect(identifier('9lives')).toBe('"9lives"');
    });
});
