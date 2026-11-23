import { expect, test } from 'vitest';

import { referenceOf } from './address.ts';
import { entryScopeOf } from './entryScopes.ts';
import type { ReportKind, ReportRef } from './kinds.ts';
import { defined } from '../defined.fixture.ts';
import { placeKey } from '../domain/geography.ts';
import { subjectKey } from '../domain/subject.ts';
import { HIERARCHY } from '../hierarchy.fixture.ts';

function report(kind: ReportKind, address: string): ReportRef {
    return defined(referenceOf(kind, new URLSearchParams(address)), `a ${kind} report at '${address}'`);
}

function listed(kind: ReportKind, address: string) {
    const scope = entryScopeOf(report(kind, address), HIERARCHY);
    return [
        subjectKey(scope.what),
        placeKey(scope.where),
        scope.period.from ?? '',
        scope.period.to ?? '',
        scope.variant ?? '',
    ].join('|');
}

test('a location report lists every pathogen in the place', () => {
    expect(listed('location', 'where=country:Uganda&when=2024-01-01/..')).toBe('|country:Uganda|2024-01-01||');
});

test('a virus report lists its subject', () => {
    expect(listed('virus', 'what=pathogen:mpox/clade=Ib&where=country:Uganda')).toBe(
        'pathogen:mpox/clade=Ib|country:Uganda|||',
    );
});

test('a lineage report lists the pathogen that it is compared with, which includes the lineage', () => {
    // The accession list includes the wider comparison used for the lineage proportion.
    expect(listed('lineage', 'what=pathogen:mpox/clade=Ib/lineage=B.1')).toBe('pathogen:mpox||||');
    // The same rule applies when the lineage is nested within an explicit hierarchy.
    expect(listed('lineage', 'what=pathogen:rsv_b/lineage=B.D.E.1&where=continent:Asia')).toBe(
        'pathogen:rsv_b|continent:Asia|||',
    );
    expect(listed('lineage', 'what=pathogen:rsv_b/lineage=B&where=continent:Asia')).toBe(
        'pathogen:rsv_b|continent:Asia|||',
    );
    // A dengue serotype has its own reference, and the comparison scope still includes the pathogen.
    expect(listed('lineage', 'what=pathogen:dengue/serotype=DENV-2')).toBe('pathogen:dengue||||');
});

test('a mutation report lists the baseline, which includes the sequences that carry the mutation', () => {
    expect(listed('mutations', 'what=pathogen:mpox&q=OPG197:E42-&where=country:Uganda')).toBe(
        'pathogen:mpox|country:Uganda|||',
    );
});
