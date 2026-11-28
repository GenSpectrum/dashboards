import { describe, expect, test } from 'vitest';

import { forKind, parseParams, referenceOf, searchOf, type ReportParams } from './reportAddress.ts';
import { hrefOf, KIND_PATHS } from './reportKinds.ts';
import type { ReportRef } from '../domain/reports.ts';
import { subjectKey } from '../domain/subject.ts';
import { defined } from '../test/defined.fixture.ts';

const params = (text: string) => new URLSearchParams(text);
const WORLD = { level: 'world' } as const;
const UGANDA = { level: 'country', country: 'Uganda' } as const;
const FULL = 'where=country:Uganda&what=pathogen:mpox/clade=Ib&q=OPG197:E42-&when=2024-01-01/..';

describe('the parameters in a report address', () => {
    test('hold everything a report could be configured by, and are written back as they were', () => {
        const parsed = parseParams(params(FULL));
        expect(parsed.where).toEqual(UGANDA);
        expect(parsed.what === undefined ? undefined : subjectKey(parsed.what)).toBe('pathogen:mpox/clade=Ib');
        expect(parsed.query).toBe('OPG197:E42-');
        expect(parsed.period).toEqual({ from: '2024-01-01', to: undefined });
        expect(searchOf(parsed).toString()).toBe(params(FULL).toString());
    });

    test('leave a default out of the address', () => {
        const defaults: ReportParams = { where: WORLD, query: '', period: {} };
        expect(searchOf(defaults).toString()).toBe('');
    });

    test('take a value that no query can hold as absent', () => {
        const parsed = parseParams(params('what=pathogen%3Arsv_a%2Flineage%3DA.D&where=country%3AUSA%00&q=C1T%0A'));
        expect(parsed.where).toEqual(WORLD);
        expect(parsed.query).toBe('');
        expect(parsed.what?.kind).toBe('subtype');
        expect(parseParams(params('what=pathogen%3Arsv_a%2Flineage%3DA%00')).what).toBeUndefined();
    });
});

describe('the report that an address names', () => {
    const parsed = (text: string) => parseParams(params(text));

    test('is a report of any kind, with the place, from the same parameters', () => {
        for (const kind of ['location', 'virus', 'lineage', 'mutations'] as const) {
            const report = defined(referenceOf(kind, parsed(FULL)), `a ${kind} report`);
            expect(report.kind).toBe(kind);
            expect(report.where).toEqual(UGANDA);
        }
    });

    test('is no report while the address names nothing for it to be about', () => {
        expect(referenceOf('location', parsed(''))).toEqual({ kind: 'location', where: WORLD, period: {} });
        expect(referenceOf('virus', parsed(''))).toBeUndefined();
        expect(referenceOf('lineage', parsed('what=pathogen:mpox'))).toBeUndefined();
        expect(referenceOf('lineage', parsed('what=pathogen:mpox/clade=Ib'))?.kind).toBe('lineage');
        expect(referenceOf('mutations', parsed('what=pathogen:rsv_b'))).toBeUndefined();
        expect(referenceOf('mutations', parsed('what=pathogen:rsv_b&q=F:S190N'))?.kind).toBe('mutations');
    });
});

describe('moving to another kind of report', () => {
    const rsvLineage = parseParams(params('what=pathogen:rsv_b/lineage=B.D.E.1&q=F:S190N&when=2024-01-01/..'));
    const dengueLineage = parseParams(params('what=pathogen:dengue/serotype=DENV-2/lineage=2II'));
    const subjectFor = (kind: 'virus' | 'lineage' | 'mutations', from: ReportParams) => {
        const what = forKind(kind, from).what;
        return what === undefined ? undefined : subjectKey(what);
    };

    test('takes a lineage to the pathogen it lies in, for a virus report and a mutation report', () => {
        expect(subjectFor('virus', rsvLineage)).toBe('pathogen:rsv_b');
        expect(subjectFor('mutations', rsvLineage)).toBe('pathogen:rsv_b');
        expect(subjectFor('lineage', rsvLineage)).toBe('pathogen:rsv_b/lineage=B.D.E.1');
    });

    test('keeps a dengue serotype, which selects the reference genome', () => {
        expect(subjectFor('virus', dengueLineage)).toBe('pathogen:dengue/serotype=DENV-2');
        expect(subjectFor('mutations', dengueLineage)).toBe('pathogen:dengue/serotype=DENV-2');
    });

    test('keeps the mutation query for a mutation report alone', () => {
        expect(forKind('mutations', rsvLineage).query).toBe('F:S190N');
        expect(forKind('virus', rsvLineage).query).toBe('');
    });

    test('leaves behind what the new report cannot be about', () => {
        expect(searchOf(forKind('location', rsvLineage)).toString()).toBe('when=2024-01-01%2F..');
        const family = parseParams(params('what=family:rsv&where=country:Uganda'));
        expect(searchOf(forKind('lineage', family)).toString()).toBe('where=country%3AUganda');
    });
});

describe('a link to a report', () => {
    const mpox = defined(parseParams(params('what=pathogen:mpox')).what, 'mpox as a subject');

    test('opens at the path of its kind', () => {
        const references: ReportRef[] = [
            { kind: 'location', where: WORLD, period: {} },
            { kind: 'virus', what: mpox, where: WORLD, period: {} },
            { kind: 'lineage', what: mpox, where: WORLD, period: {} },
            { kind: 'mutations', what: mpox, where: WORLD, query: 'OPG019:G112C', period: {} },
        ];
        for (const reference of references) {
            expect(hrefOf(reference).split('?')[0]).toBe(KIND_PATHS[reference.kind]);
        }
    });

    test('carries the subject, the place and the period, and leaves the world out', () => {
        expect(hrefOf({ kind: 'virus', what: mpox, where: UGANDA, period: { from: '2024-01-01' } })).toBe(
            `${KIND_PATHS.virus}?where=country%3AUganda&what=pathogen%3Ampox&when=2024-01-01%2F..`,
        );
        expect(hrefOf({ kind: 'virus', what: mpox, where: WORLD, period: {} })).toBe(
            `${KIND_PATHS.virus}?what=pathogen%3Ampox`,
        );
        expect(hrefOf({ kind: 'location', where: WORLD, period: {} })).toBe(KIND_PATHS.location);
    });
});
