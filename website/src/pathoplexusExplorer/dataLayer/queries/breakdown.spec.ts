import { describe, expect, test } from 'vitest';

import { breakdownNeeds, partsOf, resolveBreakdown, valueParts, type InstanceShape } from './breakdown.ts';
import { CATALOG } from '../../domain/catalog.ts';
import { WORLD } from '../../domain/geography.ts';
import type { Scope } from '../../domain/scope.ts';
import { parseSubject, type Subject } from '../../domain/subject.ts';
import { defined } from '../../test/defined.fixture.ts';
import { HIERARCHY } from '../../test/hierarchy.fixture.ts';
import type { RhydbRow } from '../transport/row.ts';

/* eslint-disable @typescript-eslint/naming-convention -- the keys are lineage and clade names */

const nodeOf = (key: string): Subject => defined(parseSubject(key, CATALOG), `'${key}' in the catalog`);

const SHAPE: InstanceShape = { has: () => true, hierarchy: HIERARCHY };

function scope(what: Subject): Scope {
    return { what, where: WORLD, period: {} };
}

function rows(counts: Readonly<Record<string, number>>, column = 'lineage'): RhydbRow[] {
    return Object.entries(counts).map(([value, n]) => ({ [column]: value, n }));
}

const RSV_A = { 'A.1': 10, 'A.2': 20, 'A.3': 5, 'A.3.1': 1, 'A.D': 100, 'A.D.1': 40, 'A.D.5.2': 7, 'None': 3 };

describe('a breakdown by a column the instance defines a hierarchy for', () => {
    const known = Object.keys(RSV_A);

    test('the parts of a pathogen are the branches below its single trunk', () => {
        const spec = resolveBreakdown(scope(nodeOf('pathogen:rsv_a')), CATALOG, SHAPE, known);
        const parts = partsOf(rows(RSV_A), spec);
        expect(spec.of).toBe('classification');
        expect(parts.map((part) => [part.key, part.n])).toEqual([
            ['A.3', 153],
            ['A.2', 20],
            ['A.1', 10],
            ['(unassigned)', 3],
        ]);
    });

    test('the parts add up to every row counted', () => {
        const spec = resolveBreakdown(scope(nodeOf('pathogen:rsv_a')), CATALOG, SHAPE, known);
        const parts = partsOf(rows(RSV_A), spec);
        const total = Object.values(RSV_A).reduce((sum, n) => sum + n, 0);
        expect(parts.reduce((sum, part) => sum + part.n, 0)).toBe(total);
    });

    test('a lineage breaks down into the lineages that the definition holds below it', () => {
        const spec = resolveBreakdown(scope(nodeOf('pathogen:rsv_a/lineage=A.D')), CATALOG, SHAPE, known);
        const parts = partsOf(rows({ 'A.D': 100, 'A.D.1': 40, 'A.D.5.2': 7 }), spec);
        expect(parts.map((part) => [part.key, part.n, part.exact])).toEqual([
            ['=A.D', 100, true],
            ['A.D.1', 40, false],
            ['A.D.5', 7, false],
        ]);
        expect(valueParts(parts).map((part) => part.key)).toEqual(['A.D.1', 'A.D.5']);
    });

    test('a lineage the breakdown went down through holds its own sequences, not the ones below it', () => {
        const spec = resolveBreakdown(scope(nodeOf('pathogen:rsv_a/lineage=A.3')), CATALOG, SHAPE, known);
        expect(spec.through).toEqual(['A.3.1', 'A.3.1.1', 'A.D']);
        const parts = partsOf(rows({ 'A.3': 5, 'A.3.1': 1, 'A.D': 100, 'A.D.1': 40, 'A.D.5.2': 7 }), spec);
        expect(parts.map((part) => [part.key, part.n])).toEqual([
            ['=A.D', 100],
            ['A.D.1', 40],
            ['A.D.5', 7],
            ['=A.3', 5],
            ['=A.3.1', 1],
        ]);
        expect(parts.reduce((sum, part) => sum + part.n, 0)).toBe(153);
        expect(valueParts(parts).map((part) => part.key)).toEqual(['=A.D', 'A.D.1', 'A.D.5', '=A.3.1']);
    });

    test('the trunk the breakdown went down is named, so the report can draw it', () => {
        const spec = resolveBreakdown(scope(nodeOf('pathogen:rsv_a')), CATALOG, SHAPE, known);
        expect(spec.through).toEqual(['A']);
        const dengue = resolveBreakdown(scope(nodeOf('pathogen:dengue/serotype=DENV-2')), CATALOG, SHAPE, [
            '1I',
            '1I_K',
            '2II',
            '2II_A',
        ]);
        expect(dengue.title).toBe('Lineage');
        expect(dengue.through).toEqual([]);
    });

    test('the values of the column are what the breakdown asks for', () => {
        expect(breakdownNeeds(scope(nodeOf('pathogen:rsv_a')), SHAPE)).toEqual({
            table: 'rsv_a',
            column: 'lineage',
        });
    });
});

describe('a breakdown by a column the instance defines nothing for', () => {
    test('its values stand side by side, and nothing is asked about them first', () => {
        const node = nodeOf('pathogen:mpox');
        expect(breakdownNeeds(scope(node), SHAPE)).toBeUndefined();
        const spec = resolveBreakdown(scope(node), CATALOG, SHAPE, undefined);
        const parts = partsOf(rows({ Ia: 12, Ib: 8, unassigned: 2 }, 'clade'), spec);
        expect(spec.title).toBe('Clade');
        expect(parts.map((part) => [part.key, part.n])).toEqual([
            ['Ia', 12],
            ['Ib', 8],
            ['(unassigned)', 2],
        ]);
    });

    test('a value of it has no level below it, so the report turns to the next level instead', () => {
        const spec = resolveBreakdown(scope(nodeOf('pathogen:mpox/clade=Ib')), CATALOG, SHAPE, undefined);
        expect(spec.title).toBe('Lineage');
        const spread = resolveBreakdown(scope(nodeOf('pathogen:mpox/clade=Ib/lineage=B.1')), CATALOG, SHAPE, undefined);
        expect(spread.of).toBe('place');
    });
});
