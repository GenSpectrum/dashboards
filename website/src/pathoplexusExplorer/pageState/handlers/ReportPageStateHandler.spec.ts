import { expect, test } from 'vitest';

import { ReportPageStateHandler } from './ReportPageStateHandler.ts';
import { KIND_PATHS } from '../reportKinds.ts';

const opened = (kind: 'virus' | 'lineage' | 'mutations', search: string) =>
    new ReportPageStateHandler(kind).parsePageStateFromUrl(new URL(`https://example.org${KIND_PATHS[kind]}?${search}`));

test('a virus report opened at a lineage shows the pathogen that the lineage lies in', () => {
    expect(opened('virus', 'what=pathogen:rsv_b/lineage=B.D').what?.kind).toBe('pathogen');
});

test('a lineage report opened at a family names no subject, and writes the bare path', () => {
    const state = opened('lineage', 'what=family:rsv');

    expect(state.what).toBeUndefined();
    expect(new ReportPageStateHandler('lineage').toUrl(state)).toBe(KIND_PATHS.lineage);
});

test('a mutation report opened at a lineage keeps it, but moving to a mutation report drops it', () => {
    const state = opened('mutations', 'what=pathogen:rsv_a/lineage=A.D&q=F:K68N');

    expect(state.what?.kind).toBe('subtype');
    expect(state.query).toBe('F:K68N');
    expect(new ReportPageStateHandler('lineage').urlForKind('mutations', state)).toBe(
        `${KIND_PATHS.mutations}?what=pathogen%3Arsv_a&q=F%3AK68N`,
    );
});
