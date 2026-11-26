import { formatLongDate, periodKey } from '../domain/dates.ts';
import { placeKey, placeLabel, subregionOf, type Place } from '../domain/geography.ts';
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

export function scopeLine(reference: ReportRef, today: string = currentDate()): string {
    const period = periodLabel(reference.period, today);
    if (reference.kind === 'location' || reference.where.level === 'world') {
        return reference.kind === 'location' ? period : `Worldwide · ${period}`;
    }
    return `${placeLabel(reference.where)} · ${period}`;
}

function periodLabel(period: Period, today: string): string {
    if (period.from === undefined && period.to === undefined) {
        return 'all collection dates';
    }
    if (period.from !== undefined && period.to !== undefined) {
        return `collected between ${formatLongDate(period.from)} and ${formatLongDate(period.to)}`;
    }
    // Use the report date as the display end of an open collection period.
    return period.from !== undefined
        ? `collected between ${formatLongDate(period.from)} and ${formatLongDate(today)}`
        : `collected up to ${formatLongDate(period.to)}`;
}

function currentDate(): string {
    return new Date().toISOString().slice(0, 10);
}

/** Why no sequences can match a report's scope, if none can. */
export function impossibleScope(reference: ReportRef): string | undefined {
    const { from, to } = reference.period;
    if (from !== undefined && to !== undefined && from > to) {
        return 'Error: The selected start date is after the end date.';
    }
    const country = unknownCountryOf(reference.where);
    return country === undefined ? undefined : `Error: Pathoplexus records no country named “${country}”.`;
}

function unknownCountryOf(where: Place): string | undefined {
    if (where.level !== 'country' && where.level !== 'admin1') {
        return undefined;
    }
    return subregionOf(where.country) === undefined ? where.country : undefined;
}
