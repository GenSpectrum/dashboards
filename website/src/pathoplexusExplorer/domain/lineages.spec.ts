import { expect, test } from 'vitest';

import {
    compareSubtypes,
    isUnassignedValue,
    lineageTreeOf,
    normalizeSubtype,
    UNASSIGNED,
    type LineageDefinition,
} from './lineages.ts';
import { defined } from '../defined.fixture.ts';
import { HIERARCHY } from '../hierarchy.fixture.ts';

/* eslint-disable @typescript-eslint/naming-convention -- the keys are lineage names */

const rsvA = defined(HIERARCHY('rsv_a', 'lineage'), 'the RSV-A lineage hierarchy');
const dengue = defined(HIERARCHY('dengue', 'lineage'), 'the dengue lineage hierarchy');
const hmpv = defined(HIERARCHY('hmpv', 'lineage'), 'the hMPV lineage hierarchy');

test('what a lineage lies within is what the definition says, not what its name suggests', () => {
    expect(rsvA.isWithin('A.D', 'A.3')).toBe(true);
    expect(rsvA.ancestorsOf('A.D.5.2')).toEqual(['A', 'A.3', 'A.3.1', 'A.3.1.1', 'A.D', 'A.D.5']);
    expect(dengue.isWithin('1I_K.1.1.1', '1I_K.1.1')).toBe(false);
    expect(dengue.isWithin('1I_K.1.1.1', '1I_K')).toBe(true);
    expect(hmpv.isWithin('A2.1', 'A')).toBe(true);
    expect(hmpv.within('A')).toEqual(['A', 'A1', 'A2', 'A2.1']);
});

test('a lineage rolls up to the name one level below a node', () => {
    expect(rsvA.rollUp('A.D.5.2', undefined)).toBe('A');
    expect(rsvA.rollUp('A.D.5.2', 'A')).toBe('A.3');
    expect(rsvA.rollUp('A.D.5.2', 'A.D')).toBe('A.D.5');
    expect(rsvA.rollUp('A.D.5.2', 'A.D.5')).toBe('A.D.5.2');
    expect(rsvA.rollUp('A.9.9', 'A')).toBe('A.9.9');
    expect(rsvA.rollUp('A.1', 'A.D')).toBe('A.1');
});

test('a name is read under the name it is an alias of', () => {
    const definition: LineageDefinition = {
        'A': {},
        'A.1': { parents: ['A'], aliases: ['a.1'] },
        'A.1.1': { parents: ['A.1'] },
    };
    const tree = lineageTreeOf(definition);
    expect(tree.canonicalOf('a.1')).toBe('A.1');
    expect(tree.has('a.1')).toBe(true);
    expect(tree.isWithin('a.1', 'A')).toBe(true);
    expect(tree.rollUp('a.1', 'A')).toBe('A.1');
    expect(tree.has('A.2')).toBe(false);
});

test('a name with several parents is held under the first of them', () => {
    const tree = lineageTreeOf({ A: {}, B: {}, X: { parents: ['B', 'A'] } });
    expect(tree.parentOf('X')).toBe('B');
    expect(tree.within('B')).toEqual(['B', 'X']);
    expect(tree.within('A')).toEqual(['A']);
});

test('missing and unassigned values are one category', () => {
    expect(isUnassignedValue(null)).toBe(true);
    expect(isUnassignedValue('None')).toBe(true);
    expect(isUnassignedValue('unassigned')).toBe(true);
    expect(normalizeSubtype('IIb')).toBe('IIb');
    expect(normalizeSubtype('')).toBe(UNASSIGNED);
});

test('lineage names sort naturally, unassigned last', () => {
    expect(['A.10', UNASSIGNED, 'A.2'].sort(compareSubtypes)).toEqual(['A.2', 'A.10', UNASSIGNED]);
});
