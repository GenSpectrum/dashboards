import { expect, test } from 'vitest';

/* eslint-disable @typescript-eslint/naming-convention -- the keys are lineage names */

import { DEFINITION_COLUMN, DEFINITION_JSON } from './definitions.ts';
import { hierarchyOf, scopePlan } from './resolve.ts';
import { CATALOG } from '../../domain/catalog.ts';
import { WORLD } from '../../domain/geography.ts';
import type { Scope } from '../../domain/scope.ts';
import { parseSubject } from '../../domain/subject.ts';
import { defined } from '../../test/defined.fixture.ts';
import { HIERARCHY } from '../../test/hierarchy.fixture.ts';

const subject = (key: string) => defined(parseSubject(key, CATALOG), `'${key}' in the catalog`);

const scopeOf = (partial: Partial<Scope>): Scope => ({
    what: subject('pathogen:rsv_a'),
    where: WORLD,
    period: {},
    ...partial,
});

test('a scope that narrows to nothing in particular needs no lookup before it can be written', () => {
    expect(scopePlan([scopeOf({})], CATALOG).queries).toHaveLength(0);
});

test('scopes that need the same values ask for them once', () => {
    const unassigned = scopeOf({ what: subject('pathogen:rsv_a/lineage=(unassigned)') });
    const plan = scopePlan([unassigned, unassigned], CATALOG);

    expect(plan.queries).toHaveLength(1);
    expect(plan.queries[0].render()).toContain('group(by := {lineage}');
});

test('a province is resolved against the spellings the country records', () => {
    const scope = scopeOf({ where: { level: 'admin1', country: 'USA', admin1: 'Illinois' } });
    const plan = scopePlan([scope], CATALOG);
    const rows = [[{ geoLocAdmin1: 'Illinois' }, { geoLocAdmin1: 'IL' }, { geoLocAdmin1: 'Texas' }]];

    expect(() => plan.resolve([[{ wrongColumn: 'IL' }]], HIERARCHY)).toThrow('geoLocAdmin1');
    const [resolved] = plan.resolve(rows, HIERARCHY);

    expect(resolved.filter('rsv_a')?.render()).toBe("geoLocCountry = 'USA' && geoLocAdmin1.in({'Illinois', 'IL'})");
});

test('a lineage definition the instance holds becomes the hierarchy that a filter uses', () => {
    const hierarchy = hierarchyOf([
        {
            [DEFINITION_COLUMN]: 'rsv_a_lineage',
            [DEFINITION_JSON]: JSON.stringify({ 'A.D': { parents: ['A.3'] }, 'A.3': {} }),
        },
    ]);

    expect(hierarchy('rsv_a', 'lineage')?.parentOf('A.D')).toBe('A.3');
    expect(hierarchy('mpox', 'clade')).toBeUndefined();
});

test('a definition that is not readable is reported rather than passed on as an empty hierarchy', () => {
    expect(() => hierarchyOf([{ [DEFINITION_COLUMN]: 'rsv_a_lineage', [DEFINITION_JSON]: 'not json' }])).toThrow(
        'could not be read',
    );
});
