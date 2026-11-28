import { expect, test } from 'vitest';

import { CATALOG } from './catalog.ts';
import { entryScopeOf } from './entryScopes.ts';
import { placeKey, WORLD, type Place } from './geography.ts';
import type { ReportRef } from './reports.ts';
import { parseSubject, subjectKey, type Subject } from './subject.ts';
import { defined } from '../test/defined.fixture.ts';
import { HIERARCHY } from '../test/hierarchy.fixture.ts';

const subject = (key: string): Subject => defined(parseSubject(key, CATALOG), `'${key}' in the catalog`);
const UGANDA: Place = { level: 'country', country: 'Uganda' };
const ASIA: Place = { level: 'continent', continent: 'Asia' };

/** The scope whose entries a report lists, as `subject|place|from|to|variant`. */
function listed(report: ReportRef): string {
    const scope = entryScopeOf(report, HIERARCHY);
    return [
        subjectKey(scope.what),
        placeKey(scope.where),
        scope.period.from ?? '',
        scope.period.to ?? '',
        scope.variant ?? '',
    ].join('|');
}

test('a location report lists every pathogen in the place', () => {
    expect(listed({ kind: 'location', where: UGANDA, period: { from: '2024-01-01' } })).toBe(
        '|country:Uganda|2024-01-01||',
    );
});

test('a virus report lists its subject', () => {
    expect(listed({ kind: 'virus', what: subject('pathogen:mpox/clade=Ib'), where: UGANDA, period: {} })).toBe(
        'pathogen:mpox/clade=Ib|country:Uganda|||',
    );
});

test('a lineage report lists the pathogen that it compares the lineage with, which includes the lineage', () => {
    const lineage = (key: string, where: Place = WORLD) =>
        listed({ kind: 'lineage', what: subject(key), where, period: {} });
    expect(lineage('pathogen:mpox/clade=Ib/lineage=B.1')).toBe('pathogen:mpox||||');
    expect(lineage('pathogen:rsv_b/lineage=B.D.E.1', ASIA)).toBe('pathogen:rsv_b|continent:Asia|||');
    expect(lineage('pathogen:rsv_b/lineage=B', ASIA)).toBe('pathogen:rsv_b|continent:Asia|||');
    expect(lineage('pathogen:dengue/serotype=DENV-2')).toBe('pathogen:dengue||||');
});

test('a mutation report lists the baseline, which includes the sequences that carry the mutation', () => {
    const report: ReportRef = {
        kind: 'mutations',
        what: subject('pathogen:mpox'),
        where: UGANDA,
        query: 'OPG197:E42-',
        period: {},
    };
    expect(listed(report)).toBe('pathogen:mpox|country:Uganda|||');
});
