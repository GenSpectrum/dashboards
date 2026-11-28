import { describe, expect, test } from 'vitest';

import {
    constrainedCount,
    formatConstraints,
    parseConstraints,
    withDimensionCleared,
    withDimensionInverted,
    withoutStrandedChoices,
    withValueToggled,
} from './matrixSelection.ts';
import { dimensionsFor, NOTHING } from '../dataLayer/queries/dimensions.ts';
import type { Constraints } from '../dataLayer/queries/selection.ts';
import { CATALOG } from '../domain/catalog.ts';
import { allPathogens } from '../domain/subject.ts';
import { defined } from '../test/defined.fixture.ts';

const selectionOf = (text: string) => defined(parseConstraints(text), 'Matrix selection');
const DIMENSIONS = dimensionsFor({ catalog: CATALOG, tables: allPathogens(CATALOG).map((pathogen) => pathogen.table) });

describe('a selection in an address', () => {
    test('is read back as it was written', () => {
        const selection: Constraints = {
            country: { values: ['!important', 'Brazil', 'Viet Nam', 'a;b', 'c,d=e', '(none)', NOTHING] },
            host: { values: ['human'], exclude: true },
        };
        expect(parseConstraints(formatConstraints(selection))).toEqual(selection);
    });

    test('writes a value nothing was recorded for as a word rather than as a control character', () => {
        const written = formatConstraints({ country: { values: [NOTHING] } });
        expect(written).toBe('country=(none)');
        expect(parseConstraints(written)).toEqual({ country: { values: [NOTHING] } });
    });

    test('rejects a partially readable selection', () => {
        expect(parseConstraints('nonsense;=;country=')).toBeUndefined();
        expect(parseConstraints(null)).toEqual({});
        expect(parseConstraints('country=%ZZ')).toEqual({ country: { values: ['%ZZ'] } });
    });

    test('takes a value named like a built-in property as a value, not as a change to the object itself', () => {
        const constraints = selectionOf('__proto__=brazil');

        expect(Object.keys(constraints)).toEqual(['__proto__']);
        expect(constraints.__proto__).toEqual({ values: ['brazil'] });
        expect(Object.getPrototypeOf({})).toEqual({});
    });

    test('loses the choices that no dimension can hold: a submitting group that is no group ID, a year that is no year', () => {
        expect(withoutStrandedChoices(selectionOf('group=abc;country=Brazil'), DIMENSIONS)).toEqual({
            country: { values: ['Brazil'] },
        });
        expect(withoutStrandedChoices(selectionOf('group=12'), DIMENSIONS)).toBeUndefined();
        expect(withoutStrandedChoices(selectionOf('year=abc,2024,(none)'), DIMENSIONS)).toEqual({
            year: { values: ['2024', NOTHING] },
        });
    });
});

describe('choosing values', () => {
    test('adds one, and lets it go again', () => {
        const chosen = withValueToggled({}, 'country', 'Brazil');
        expect(chosen).toEqual({ country: { values: ['Brazil'] } });
        expect(withValueToggled(chosen, 'country', 'Brazil')).toEqual({});
    });

    test('keeps the values of a dimension as alternatives', () => {
        const chosen = withValueToggled(withValueToggled({}, 'country', 'Brazil'), 'country', 'India');
        expect(chosen.country?.values).toEqual(['Brazil', 'India']);
        expect(constrainedCount(chosen)).toBe(1);
    });

    test('inverts a dimension, and lets it go', () => {
        const inverted = withDimensionInverted(withValueToggled({}, 'host', 'human'), 'host');
        expect(inverted.host?.exclude).toBe(true);
        expect(withDimensionInverted(inverted, 'host').host?.exclude).toBe(false);
    });

    test('clears one dimension and leaves the others', () => {
        const chosen = withValueToggled(withValueToggled({}, 'country', 'Brazil'), 'host', 'human');
        expect(withDimensionCleared(chosen, 'country')).toEqual({ host: { values: ['human'] } });
    });
});
