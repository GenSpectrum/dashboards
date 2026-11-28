import { formatLongDate, hasReversedDates, periodKey, reportPeriod, todayUtc } from '../domain/dates.ts';
import { placeKey, placeLabel, placedCountryOf, type Place } from '../domain/geography.ts';
import type { ReportKind, ReportRef } from '../domain/reports.ts';
import type { Period } from '../domain/scope.ts';
import { subjectKey, subjectPhrase, subjectTitle, type Subject } from '../domain/subject.ts';

export const REPORTS_BASE_PATH = '/pathoplexus-explorer/reports';

export const REPORTS_LABEL = 'Reports';

export const KIND_PATHS: Readonly<Record<ReportKind, string>> = {
    location: `${REPORTS_BASE_PATH}/location`,
    virus: `${REPORTS_BASE_PATH}/virus`,
    lineage: `${REPORTS_BASE_PATH}/lineage`,
    mutations: `${REPORTS_BASE_PATH}/mutations`,
};

export const KIND_LABELS: Readonly<Record<ReportKind, string>> = {
    location: 'Location report',
    virus: 'Virus report',
    lineage: 'Lineage report',
    mutations: 'Mutation report',
};

export const KIND_DESCRIPTIONS: Readonly<Record<ReportKind, string>> = {
    location: 'from one place (a state/province, country, continent or the whole world), across every pathogen.',
    virus: 'a virus or a family of viruses',
    lineage: 'one lineage or clade',
    mutations: 'one mutation or a combination of mutations',
};

/** Build report URLs here for both links and page state. */
export function searchOf(params: { where: Place; what?: Subject; query?: string; period: Period }): URLSearchParams {
    const search = new URLSearchParams();
    if (params.where.level !== 'world') {
        search.set('where', placeKey(params.where));
    }
    if (params.what !== undefined) {
        search.set('what', subjectKey(params.what));
    }
    if (params.query !== undefined && params.query !== '') {
        search.set('q', params.query);
    }
    const when = periodKey(params.period);
    if (when !== undefined) {
        search.set('when', when);
    }
    return search;
}

export function addressOf(kind: ReportKind, search: URLSearchParams): string {
    const query = search.toString();
    return query === '' ? KIND_PATHS[kind] : `${KIND_PATHS[kind]}?${query}`;
}

export function hrefOf(reference: ReportRef): string {
    return addressOf(
        reference.kind,
        searchOf({
            where: reference.where,
            what: reference.kind === 'location' ? undefined : reference.what,
            query: reference.kind === 'mutations' ? reference.query : undefined,
            period: reference.period,
        }),
    );
}

export function reportsPageTitle(): string {
    return `${REPORTS_LABEL} | GenSpectrum`;
}

export function reportPageTitle(kind: ReportKind, reference?: ReportRef): string {
    const subject = reference === undefined ? undefined : titleOf(reference);
    return [subject, KIND_LABELS[kind], 'GenSpectrum'].filter((part) => part !== undefined).join(' | ');
}

export function titleOf(reference: ReportRef): string {
    switch (reference.kind) {
        case 'location':
            return reference.where.level === 'world'
                ? 'Pathogen sequencing worldwide'
                : `Pathogen sequencing in ${placeLabel(reference.where)}`;
        case 'virus':
            return subjectPhrase(reference.what);
        case 'lineage':
            return subjectTitle(reference.what);
        case 'mutations':
            return `${reference.query} in ${subjectTitle(reference.what)}`;
    }
}

export function scopeLine(reference: ReportRef, today: string = todayUtc()): string {
    const period = periodLabel(reportPeriod(reference.period, today));
    if (reference.kind === 'location' || reference.where.level === 'world') {
        return reference.kind === 'location' ? period : `Worldwide · ${period}`;
    }
    return `${placeLabel(reference.where)} · ${period}`;
}

function periodLabel({ from, to }: Period): string {
    if (to === undefined) {
        return 'all collection dates';
    }
    return from === undefined
        ? `collected up to ${formatLongDate(to)}`
        : `collected between ${formatLongDate(from)} and ${formatLongDate(to)}`;
}

/** Why no sequences can match a report's scope, if none can. */
export function impossibleScope(reference: ReportRef): string | undefined {
    if (hasReversedDates(reportPeriod(reference.period))) {
        return 'Error: The selected start date is after the end date.';
    }
    const country = unknownCountryOf(reference.where);
    return country === undefined ? undefined : `Error: Pathoplexus records no country named “${country}”.`;
}

function unknownCountryOf(where: Place): string | undefined {
    if (where.level !== 'country' && where.level !== 'admin1') {
        return undefined;
    }
    return placedCountryOf(where.country) === undefined ? where.country : undefined;
}
