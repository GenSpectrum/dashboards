import { expect, test } from 'vitest';

import { forKind, parseParams, referenceOf, searchOf, type ReportParams } from './address.ts';
import { hrefOf, KIND_PATHS, titleOf, type ReportKind, type ReportRef } from './kinds.ts';
import { ReportPageStateHandler } from './reportPageState.ts';
import { defined } from '../defined.fixture.ts';
import { subjectKey } from '../domain/subject.ts';

function params(text: string) {
    return new URLSearchParams(text);
}

function reportOf(kind: ReportKind, search: URLSearchParams): ReportRef {
    return defined(referenceOf(kind, search), `a ${kind} report at '${search.toString()}'`);
}

test('the address holds everything a report could be configured by', () => {
    const parsed = parseParams(
        params('where=country:Uganda&what=pathogen:mpox/clade=Ib&q=OPG197:E42-&when=2024-01-01/..'),
    );
    expect(parsed.where).toEqual({ level: 'country', country: 'Uganda' });
    expect(parsed.what?.kind).toBe('subtype');
    expect(parsed.query).toBe('OPG197:E42-');
    expect(parsed.period).toEqual({ from: '2024-01-01', to: undefined });
});

test('a parameter the open report does not use is kept, so moving between kinds keeps the scope', () => {
    const search = params('where=country:Uganda&what=pathogen:mpox/clade=Ib&q=OPG197:E42-&when=2024-01-01/..');
    expect(searchOf(parseParams(search)).toString()).toBe(search.toString());
    expect(referenceOf('location', search)?.kind).toBe('location');
    expect(referenceOf('lineage', search)?.kind).toBe('lineage');
    expect(referenceOf('mutations', search)?.kind).toBe('mutations');
});

test('a default is left out of the address', () => {
    const empty: ReportParams = { where: { level: 'world' }, query: '', period: {} };
    expect(searchOf(empty).toString()).toBe('');
});

test('a report with nothing to be about yet is not a report', () => {
    expect(referenceOf('virus', params(''))).toBeUndefined();
    expect(referenceOf('lineage', params('what=pathogen:mpox'))).toBeUndefined();
    expect(referenceOf('lineage', params('what=pathogen:mpox/clade=Ib'))?.kind).toBe('lineage');
    expect(referenceOf('mutations', params('what=pathogen:rsv_b'))).toBeUndefined();
    expect(referenceOf('mutations', params('what=pathogen:rsv_b&q=F:S190N'))?.kind).toBe('mutations');
    expect(titleOf(reportOf('location', params('')))).toBe('Pathogen sequencing worldwide');
});

test('every kind of report takes a place, and a link to one keeps it', () => {
    const search = params('where=country:Uganda&what=pathogen:mpox/clade=Ib&when=2024-01-01/..');
    for (const kind of ['virus', 'lineage', 'mutations'] as const) {
        const parsed = reportOf(kind, kind === 'mutations' ? params(`${search.toString()}&q=OPG197:E42-`) : search);
        expect(parsed.kind === 'location' ? undefined : parsed.where).toEqual({
            level: 'country',
            country: 'Uganda',
        });
    }
    const href = hrefOf(reportOf('virus', search));
    expect(href).toContain('what=pathogen%3Ampox');
    expect(href).toContain('where=country%3AUganda');
    expect(href).toContain('when=2024-01-01%2F..');
});

test('a worldwide location report has no place in its address either', () => {
    const href = hrefOf({ kind: 'location', where: { level: 'world' }, period: {} });
    expect(href).toBe(KIND_PATHS.location);
    expect(referenceOf('location', params(''))).toEqual({ kind: 'location', where: { level: 'world' }, period: {} });
});

test('a link to a location report names its own place rather than carrying another', () => {
    const href = hrefOf({ kind: 'location', where: { level: 'country', country: 'Brazil' }, period: {} });
    expect(href).toBe(`${KIND_PATHS.location}?where=country%3ABrazil`);
});

test('a worldwide report leaves the place out of its address', () => {
    const href = hrefOf(reportOf('virus', params('what=pathogen:mpox')));
    expect(href).toBe(`${KIND_PATHS.virus}?what=pathogen%3Ampox`);
});

test('a link to a report opens that report: every kind is addressed at the path it is read at', () => {
    const where = { level: 'world' } as const;
    const what = defined(parseParams(new URLSearchParams('what=pathogen:mpox')).what, 'mpox as a subject');
    const references = [
        { kind: 'location', where, period: {} },
        { kind: 'virus', what, where, period: {} },
        { kind: 'lineage', what, where, period: {} },
        { kind: 'mutations', what, where, query: 'OPG019:G112C', period: {} },
    ] as const;
    for (const reference of references) {
        expect(hrefOf(reference).split('?')[0]).toBe(KIND_PATHS[reference.kind]);
    }
});

test('a mutation report is about mutations, so moving to one drops the lineage', () => {
    const params = parseParams(new URLSearchParams('what=pathogen:rsv_b/lineage=B.D.E.1&q=F:S190N'));
    const forMutations = forKind('mutations', params);
    expect(forMutations.what?.kind).toBe('pathogen');
    expect(forMutations.query).toBe('F:S190N');
    // A dengue serotype selects the reference genome, so switching report kinds preserves it.
    const dengue = parseParams(new URLSearchParams('what=pathogen:dengue/serotype=DENV-2/lineage=2II'));
    const kept = forKind('mutations', dengue);
    expect(kept.what?.kind).toBe('subtype');
    expect(kept.what?.kind === 'subtype' && kept.what.steps).toEqual([{ column: 'serotype', value: 'DENV-2' }]);
    expect(forKind('lineage', params).what?.kind).toBe('subtype');
});

test('a virus report is about a pathogen, so a lineage in its address is taken as the subject it lies in', () => {
    const rsv = parseParams(new URLSearchParams('what=pathogen:rsv_b/lineage=B.D.E.1'));
    expect(subjectKey(defined(forKind('virus', rsv).what, 'the subject of the virus report'))).toBe('pathogen:rsv_b');
    const dengue = parseParams(new URLSearchParams('what=pathogen:dengue/serotype=DENV-2/lineage=2II'));
    expect(subjectKey(defined(forKind('virus', dengue).what, 'the subject of the virus report'))).toBe(
        'pathogen:dengue/serotype=DENV-2',
    );
    const url = new URL('https://example.org/pathoplexus-explorer/reports/virus?what=pathogen:rsv_b/lineage=B.D');
    const state = new ReportPageStateHandler('virus').parsePageStateFromUrl(url);
    expect(subjectKey(defined(state.what, 'the subject that the page shows'))).toBe('pathogen:rsv_b');
});

test('a report takes only what it is about, and leaves the rest of an address behind', () => {
    const family = parseParams(params('what=family:rsv&where=country:Uganda'));
    const forLineage = forKind('lineage', family);
    expect(forLineage.what).toBeUndefined();
    expect(searchOf(forLineage).toString()).toBe('where=country%3AUganda');
    const lineage = parseParams(params('what=pathogen:rsv_b/lineage=B.D.E.1&q=F:S190N&when=2024-01-01/..'));
    expect(searchOf(forKind('location', lineage)).toString()).toBe('when=2024-01-01%2F..');
    expect(forKind('virus', lineage).query).toBe('');
    const url = new URL('https://example.org/pathoplexus-explorer/reports/lineage?what=family:rsv');
    const state = new ReportPageStateHandler('lineage').parsePageStateFromUrl(url);
    expect(state.what).toBeUndefined();
    expect(new ReportPageStateHandler('lineage').toUrl(state)).toBe(KIND_PATHS.lineage);
});

test('a mutation report opened from an address keeps the lineage that the address names', () => {
    const url = new URL(
        'https://example.org/pathoplexus-explorer/reports/mutations?what=pathogen:rsv_a/lineage=A.D&q=F:K68N',
    );
    const state = new ReportPageStateHandler('mutations').parsePageStateFromUrl(url);
    expect(subjectKey(defined(state.what, 'the subject of the mutation report'))).toBe('pathogen:rsv_a/lineage=A.D');
    expect(state.query).toBe('F:K68N');
    const switched = new ReportPageStateHandler('lineage').urlForKind('mutations', {
        ...state,
        what: defined(state.what, 'the lineage'),
    });
    expect(switched).not.toContain('lineage');
});

test('a value in the address that no query can hold is taken as absent', () => {
    const parsed = parseParams(params('what=pathogen%3Arsv_a%2Flineage%3DA.D&where=country%3AUSA%00&q=C1T%0A'));
    expect(parsed.where).toEqual({ level: 'world' });
    expect(parsed.query).toBe('');
    expect(parsed.what?.kind).toBe('subtype');
    expect(parseParams(params('what=pathogen%3Arsv_a%2Flineage%3DA%00')).what).toBeUndefined();
});
