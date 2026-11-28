import type { Place } from './geography.ts';
import type { Period } from './scope.ts';
import type { Subject } from './subject.ts';

export const REPORT_KIND = {
    location: 'location',
    virus: 'virus',
    lineage: 'lineage',
    mutations: 'mutations',
} as const;
export type ReportKind = (typeof REPORT_KIND)[keyof typeof REPORT_KIND];

export const REPORT_KINDS: readonly ReportKind[] = Object.values(REPORT_KIND);

export type ReportRef =
    | { kind: 'location'; where: Place; period: Period }
    | { kind: 'virus'; what: Subject; where: Place; period: Period }
    | { kind: 'lineage'; what: Subject; where: Place; period: Period }
    | { kind: 'mutations'; what: Subject; where: Place; query: string; period: Period };
