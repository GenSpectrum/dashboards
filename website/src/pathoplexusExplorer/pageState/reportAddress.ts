/** Report selections are stored as URL query parameters. */

import { searchOf } from './reportKinds.ts';
import { canQuote } from '../dataLayer/transport/escape.ts';
import { CATALOG } from '../domain/catalog.ts';
import { parsePeriodKey } from '../domain/dates.ts';
import { parsePlace, WORLD, type Place } from '../domain/geography.ts';
import type { ReportKind, ReportRef } from '../domain/reports.ts';
import type { Period } from '../domain/scope.ts';
import { isPathogenNode, keepSteps, menuSubjectOf, parseSubject, type Subject } from '../domain/subject.ts';

export { searchOf };

export type ChosenSubject = Exclude<Subject, { kind: 'all' }>;

export function isChosenSubject(node: Subject | undefined): node is ChosenSubject {
    return node !== undefined && node.kind !== 'all';
}

export type ReportParams = {
    where: Place;
    what?: ChosenSubject;
    query: string;
    period: Period;
};

/** A value that a RhyQL string literal cannot hold is taken as absent, so that no query is built from it. */
function quotable(params: URLSearchParams, name: string): string | null {
    const value = params.get(name);
    return value === null || !canQuote(value) ? null : value;
}

export function parseParams(params: URLSearchParams): ReportParams {
    const what = parseSubject(quotable(params, 'what'), CATALOG);
    return {
        where: parsePlace(quotable(params, 'where')) ?? WORLD,
        what: isChosenSubject(what) ? what : undefined,
        query: (quotable(params, 'q') ?? '').trim(),
        period: parsePeriodKey(params.get('when')),
    };
}

export function referenceOf(kind: ReportKind, params: URLSearchParams): ReportRef | undefined {
    const parsed = parseParams(params);
    const period = parsed.period;
    if (kind === 'location') {
        return { kind, where: parsed.where, period };
    }
    const what = parsed.what;
    if (what === undefined) {
        return undefined;
    }
    if (kind === 'mutations') {
        return !isPathogenNode(what) || parsed.query === ''
            ? undefined
            : { kind, what, where: parsed.where, query: parsed.query, period };
    }
    if (kind === 'lineage' && what.kind !== 'subtype') {
        return undefined;
    }
    return { kind, what, where: parsed.where, period };
}

/** Retain only parameters used by the report being opened. */
export function forKind(kind: ReportKind, params: ReportParams): ReportParams {
    return {
        ...params,
        what: subjectFor(kind, params.what),
        query: kind === 'mutations' ? params.query : '',
    };
}

/**
 * Normalize the parameters of an opened address. A mutation report keeps the subtype that its address names, so that
 * a link from a lineage report counts within that lineage.
 */
export function forAddress(kind: ReportKind, params: ReportParams): ReportParams {
    const normalized = forKind(kind, params);
    return kind === 'mutations' && isPathogenNode(params.what) ? { ...normalized, what: params.what } : normalized;
}

function subjectFor(kind: ReportKind, what: ChosenSubject | undefined): ChosenSubject | undefined {
    if (what === undefined || kind === 'location') {
        return undefined;
    }
    if (kind === 'virus') {
        return menuSubjectOf(what) as ChosenSubject;
    }
    if (!isPathogenNode(what)) {
        return undefined;
    }
    if (kind === 'lineage' || what.kind !== 'subtype') {
        return what;
    }
    const column = what.pathogen.referenceColumn;
    return keepSteps(what, (step) => step.column === column) as ChosenSubject;
}
