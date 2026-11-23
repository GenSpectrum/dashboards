import { describe, expect, test } from 'vitest';

import { classificationRows } from './LineageTree.tsx';
import { defined } from '../../../pathoplexusExplorer/defined.fixture.ts';
import { CATALOG } from '../../../pathoplexusExplorer/domain/catalog.ts';
import { WORLD } from '../../../pathoplexusExplorer/domain/geography.ts';
import { parseSubject, subjectLabel, type Subject } from '../../../pathoplexusExplorer/domain/subject.ts';
import { HIERARCHY } from '../../../pathoplexusExplorer/hierarchy.fixture.ts';
import { partsOf, resolveBreakdown, type InstanceShape } from '../../../pathoplexusExplorer/rhydb/breakdown.ts';
import type { RhydbRow } from '../../../pathoplexusExplorer/rhydb/transport/row.ts';

/* eslint-disable @typescript-eslint/naming-convention -- the keys are lineage names */

const SHAPE: InstanceShape = { has: () => true, hierarchy: HIERARCHY };

const nodeOf = (key: string): Subject => defined(parseSubject(key, CATALOG), `'${key}' in the catalog`);

function rows(counts: Readonly<Record<string, number>>): RhydbRow[] {
    return Object.entries(counts).map(([value, n]) => ({ lineage: value, n }));
}

const KNOWN = ['A.1', 'A.2', 'A.3', 'A.3.1', 'A.D', 'A.D.1', 'A.D.5.2', 'None'];

function figure(key: string, counts: Readonly<Record<string, number>>) {
    const what = nodeOf(key);
    const spec = resolveBreakdown({ what, where: WORLD, period: {} }, CATALOG, SHAPE, KNOWN);
    const parts = partsOf(rows(counts), spec);
    const total = parts.reduce((sum, part) => sum + part.n, 0);
    return classificationRows({
        subject: { label: subjectLabel(what) },
        spec,
        parts,
        total,
        href: () => undefined,
        what: 'lineage',
    });
}

describe('the hierarchy that a report draws its parts in', () => {
    test('a pathogen stands above the trunk its lineages lie within', () => {
        const figured = figure('pathogen:rsv_a', { 'A.1': 10, 'A.2': 20, 'A.3': 5, 'A.D': 100, 'None': 3 });
        expect(figured.map((row) => [row.depth, row.label, row.n])).toEqual([
            [0, 'RSV-A', undefined],
            [1, 'A', undefined],
            [2, 'A.3', 105],
            [2, 'A.2', 20],
            [2, 'A.1', 10],
            [1, 'Unassigned', 3],
        ]);
    });

    test('a lineage carries the sequences assigned to it alone, on its own row', () => {
        const figured = figure('pathogen:rsv_a/lineage=A.3', {
            'A.3': 5,
            'A.3.1': 1,
            'A.D': 100,
            'A.D.1': 40,
            'A.D.5.2': 7,
        });
        expect(figured.map((row) => [row.depth, row.label, row.n])).toEqual([
            [0, 'A.3', 5],
            [1, 'A.3.1', 1],
            [2, 'A.3.1.1', undefined],
            [3, 'A.D', 100],
            [4, 'A.D.1', 40],
            [4, 'A.D.5', 7],
        ]);
        expect(figured.reduce((sum, row) => sum + (row.n ?? 0), 0)).toBe(153);
    });

    test('a name whose count holds the names within it is marked as such', () => {
        const figured = figure('pathogen:rsv_a', { 'A.1': 10, 'A.2': 20, 'A.3': 5, 'A.3.1': 100, 'None': 3 });
        expect(figured.map((row) => [row.label, row.nested])).toEqual([
            ['RSV-A', undefined],
            ['A', undefined],
            ['A.3', true],
            ['A.2', true],
            ['A.1', true],
            ['Unassigned', undefined],
        ]);
    });

    test('the names past the ones listed are gathered into one row', () => {
        const counts = Object.fromEntries(Array.from({ length: 12 }, (_, index) => [`A.D.${index + 1}`, 12 - index]));
        const figured = figure('pathogen:rsv_a/lineage=A.D', counts);
        const last = figured[figured.length - 1];
        expect(figured).toHaveLength(1 + 10 + 1);
        expect([last.label, last.n, last.rest, last.nested]).toEqual(['2 further lineages', 3, true, true]);
    });
});
