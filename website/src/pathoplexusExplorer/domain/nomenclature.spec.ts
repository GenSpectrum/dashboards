import { describe, expect, test } from 'vitest';

import { CATALOG } from './catalog.ts';
import { nomenclatureOf } from './nomenclature.ts';
import { allPathogens, parseSubject, withStep, type Subject } from './subject.ts';
import { defined } from '../defined.fixture.ts';

const nodeOf = (table: string): Subject =>
    defined(parseSubject(`pathogen:${table}`, CATALOG), `'${table}' in the catalog`);

const textOf = (node: Subject): string =>
    (nomenclatureOf(node) ?? []).map((part) => (typeof part === 'string' ? part : part.label)).join('');

describe('where a classification comes from', () => {
    test('every classified pathogen names the nomenclature it follows', () => {
        const unsourced = allPathogens(CATALOG)
            .filter((pathogen) => pathogen.levels.length > 0 || pathogen.alternatives.length > 0)
            .filter((pathogen) => nomenclatureOf(nodeOf(pathogen.table)) === undefined)
            .map((pathogen) => pathogen.table);
        expect(unsourced).toEqual(['ebola_zaire', 'ebola_sudan', 'ebola_bdbv']);
    });

    test('a lineage is told the same as the pathogen it lies in', () => {
        const dengue = nodeOf('dengue');
        const lineage = withStep(dengue, { column: 'lineage', value: '2II_A' });
        expect(textOf(dengue)).toBe('The lineages were assigned using the Dengue Lineages system.');
        expect(textOf(lineage)).toBe(textOf(dengue));
    });

    test('every sentence is one sentence, and every source is a link out', () => {
        const named = allPathogens(CATALOG).filter((pathogen) => nomenclatureOf(nodeOf(pathogen.table)) !== undefined);
        expect(named.length).toBeGreaterThan(0);

        for (const pathogen of named) {
            const parts = defined(nomenclatureOf(nodeOf(pathogen.table)), `a nomenclature for ${pathogen.table}`);
            expect(textOf(nodeOf(pathogen.table))).toMatch(/^The .*\.$/);
            for (const part of parts.filter((part) => typeof part !== 'string')) {
                expect(part.href).toMatch(/^https:\/\//);
            }
        }
    });
});
