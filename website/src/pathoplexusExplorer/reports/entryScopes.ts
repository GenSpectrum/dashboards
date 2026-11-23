/** Keep this scope in sync with report panels so that accession downloads include all entries that a report uses. */

import type { ReportRef } from './kinds.ts';
import type { Hierarchy } from '../domain/lineages.ts';
import { comparableParentOf } from '../domain/reference.ts';
import { ALL, menuSubjectOf, sameSubject, subjectAncestors, parentSubject, type Subject } from '../domain/subject.ts';
import type { Scope } from '../rhydb/queries/scope.ts';

/** The entries that a report uses: its subject, and the sequences that it is compared with, which include it. */
export function entryScopeOf(reference: ReportRef, hierarchy: Hierarchy): Scope {
    const { where, period } = reference;
    switch (reference.kind) {
        case 'location':
            return { what: ALL, where, period };
        case 'virus':
            return { what: reference.what, where, period };
        case 'lineage':
            return { what: widestAbove(reference.what, hierarchy) ?? reference.what, where, period };
        case 'mutations':
            return { what: reference.what, where, period };
    }
}

function widestAbove(what: Subject, hierarchy: Hierarchy): Subject | undefined {
    const above = [menuSubjectOf(what), comparableParentOf(what, hierarchy), parentSubject(what, hierarchy)].filter(
        (node) => node !== undefined,
    );
    return subjectAncestors(what, hierarchy).find((ancestor) => above.some((node) => sameSubject(node, ancestor)));
}
