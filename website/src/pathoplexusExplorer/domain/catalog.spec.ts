import { describe, expect, test } from 'vitest';

import { CATALOG } from './catalog.ts';
import {
    ALL,
    parseSubject,
    pathogensOf,
    staticChildren,
    subjectAncestors,
    subjectKey,
    subjectLabel,
    withStep,
    type Subject,
} from './subject.ts';
import { defined } from '../test/defined.fixture.ts';
import { HIERARCHY } from '../test/hierarchy.fixture.ts';

const nodeOf = (key: string): Subject => defined(parseSubject(key, CATALOG), `'${key}' in the catalog`);

describe('the pathogen tree', () => {
    test('keys round-trip', () => {
        for (const key of [
            '',
            'group:respiratory',
            'family:ebola',
            'pathogen:dengue',
            'pathogen:dengue/serotype=DENV-2',
            'pathogen:rsv_a/lineage=A.D/lineage=A.D.5',
        ]) {
            expect(subjectKey(nodeOf(key))).toBe(key);
        }
    });

    test('unknown keys and columns are rejected', () => {
        expect(parseSubject('pathogen:nope', CATALOG)).toBeUndefined();
        expect(parseSubject('pathogen:dengue/nonsense=1', CATALOG)).toBeUndefined();
    });

    test('a group of one pathogen is that pathogen', () => {
        const mpox = nodeOf('group:mpox');
        expect(mpox.kind).toBe('pathogen');
        expect(subjectAncestors(mpox, HIERARCHY)).toEqual([ALL]);
    });

    test('ancestors run from all pathogens down', () => {
        const node = nodeOf('pathogen:ebola_bdbv/outbreak=Bdbv-2026');
        expect(subjectAncestors(node, HIERARCHY).map(subjectLabel)).toEqual([
            'All pathogens',
            'Hemorrhagic & zoonotic',
            'Ebola',
            'Ebola Bundibugyo',
        ]);
        expect(subjectLabel(node)).toBe('Bdbv-2026');
    });

    test('a family covers the tables of its members', () => {
        expect(pathogensOf(nodeOf('family:ebola'), CATALOG).map((pathogen) => pathogen.table)).toEqual([
            'ebola_zaire',
            'ebola_sudan',
            'ebola_bdbv',
        ]);
        expect(pathogensOf(ALL, CATALOG)).toHaveLength(16);
        expect(staticChildren(ALL, CATALOG)).toHaveLength(4);
    });

    test('drilling into a lineage keeps the path', () => {
        const ad = withStep(nodeOf('pathogen:rsv_a'), { column: 'lineage', value: 'A.D' });
        const deeper = withStep(ad, { column: 'lineage', value: 'A.D.5' });
        expect(subjectAncestors(deeper, HIERARCHY).map(subjectLabel)).toEqual([
            'All pathogens',
            'Respiratory',
            'RSV',
            'RSV-A',
            'A',
            'A.3',
            'A.3.1',
            'A.3.1.1',
            'A.D',
        ]);
    });
});

test('a broken escape in an address is taken as the text it is, rather than failing the page', () => {
    const node = parseSubject('pathogen:dengue/serotype=%ZZ', CATALOG);

    expect(node?.kind).toBe('subtype');
});
