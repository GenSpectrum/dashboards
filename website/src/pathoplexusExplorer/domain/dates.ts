import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import quarterOfYear from 'dayjs/plugin/quarterOfYear.js';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);
dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

const GRANULARITY = {
    year: 'year',
    quarter: 'quarter',
    month: 'month',
    week: 'week',
} as const;
export type Granularity = (typeof GRANULARITY)[keyof typeof GRANULARITY];

const GRANULARITIES: readonly Granularity[] = Object.values(GRANULARITY);

export type IsoDate = string;

/** Validate calendar dates by round-tripping them, since parsing can normalize invalid dates. */
export function isIsoDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && dayjs.utc(value).format('YYYY-MM-DD') === value;
}

const OPEN_END = '..';

/**
 * Writes a period as an ISO 8601 interval for an address, such as `2024-01-01/2024-12-31`, with `..` for an open end.
 * A period without either end has no interval.
 */
export function periodKey(period: { from?: IsoDate; to?: IsoDate }): string | undefined {
    if (period.from === undefined && period.to === undefined) {
        return undefined;
    }
    return `${period.from ?? OPEN_END}/${period.to ?? OPEN_END}`;
}

/** Reads an interval that `periodKey` wrote. An end that is not a valid date is left open. */
export function parsePeriodKey(text: string | null): { from?: IsoDate; to?: IsoDate } {
    const ends = (text ?? '').split('/');
    if (ends.length !== 2) {
        return {};
    }
    const read = (end: string) => (isIsoDate(end) ? end : undefined);
    return { from: read(ends[0]), to: read(ends[1]) };
}

export function bucketOf(date: IsoDate, granularity: Granularity): string {
    const day = dayjs.utc(date);
    switch (granularity) {
        case 'year':
            return day.format('YYYY');
        case 'quarter':
            return `${day.format('YYYY')}-Q${day.quarter()}`;
        case 'month':
            return day.format('YYYY-MM');
        case 'week':
            // ISO weeks belong to the calendar year of their Thursday.
            return `${day.isoWeekYear()}-W${String(day.isoWeek()).padStart(2, '0')}`;
    }
}

/** Infer precision from the collection date range. A full month or year represents a date known to that precision. */
export const DATE_PRECISION = {
    day: 'day',
    month: 'month',
    year: 'year',
    wider: 'wider',
    none: 'none',
} as const;
export type DatePrecision = (typeof DATE_PRECISION)[keyof typeof DATE_PRECISION];

export function precisionOf(lower: string | null, upper: string | null): DatePrecision {
    if (lower === null || upper === null) {
        return DATE_PRECISION.none;
    }
    if (lower === upper) {
        return DATE_PRECISION.day;
    }
    const from = dayjs.utc(lower);
    const to = dayjs.utc(upper);
    if (from.isSame(from.startOf('month')) && to.isSame(from.endOf('month'), 'day')) {
        return DATE_PRECISION.month;
    }
    if (from.isSame(from.startOf('year')) && to.isSame(from.endOf('year'), 'day')) {
        return DATE_PRECISION.year;
    }
    return DATE_PRECISION.wider;
}

/** Returns a bucket only if it contains the entire date range. */
export function bucketOfRange(lower: IsoDate | null, upper: IsoDate | null, granularity: Granularity) {
    if (lower === null || upper === null) {
        return undefined;
    }
    const bucket = bucketOf(lower, granularity);
    return bucket === bucketOf(upper, granularity) ? bucket : undefined;
}

export function bucketRange(bucket: string): { from: IsoDate; to: IsoDate } {
    const year = bucket.slice(0, 4);
    const quarter = /^\d{4}-Q([1-4])$/.exec(bucket);
    const week = /^\d{4}-W(\d{2})$/.exec(bucket);
    const month = /^\d{4}-(\d{2})$/.exec(bucket);
    const start =
        quarter !== null
            ? dayjs.utc(`${year}-01-01`).quarter(Number(quarter[1])).startOf('quarter')
            : week !== null
              ? dayjs.utc(`${year}-01-04`).isoWeek(Number(week[1])).startOf('isoWeek')
              : month !== null
                ? dayjs.utc(`${year}-${month[1]}-01`)
                : dayjs.utc(`${year}-01-01`);
    const granularity: Granularity =
        quarter !== null ? 'quarter' : week !== null ? 'week' : month !== null ? 'month' : 'year';
    const end = granularity === 'week' ? start.add(6, 'day') : start.endOf(granularity);
    return { from: start.format('YYYY-MM-DD'), to: end.format('YYYY-MM-DD') };
}

export function bucketsBetween(from: IsoDate, to: IsoDate, granularity: Granularity): string[] {
    const buckets: string[] = [];
    const end = bucketOf(to, granularity);
    const week = granularity === 'week';
    let cursor = week ? dayjs.utc(from).startOf('isoWeek') : dayjs.utc(from).startOf(granularity);
    for (let guard = 0; guard < 100000; guard++) {
        const bucket = bucketOf(cursor.format('YYYY-MM-DD'), granularity);
        buckets.push(bucket);
        if (bucket >= end) {
            break;
        }
        cursor = week ? cursor.add(1, 'week') : cursor.add(1, granularity);
    }
    return buckets;
}

export function autoGranularity(from: IsoDate, to: IsoDate): Granularity {
    const days = dayjs.utc(to).diff(dayjs.utc(from), 'day');
    if (days > 365 * 10) {
        return 'year';
    }
    if (days > 365 * 4) {
        return 'quarter';
    }
    if (days > 400) {
        return 'month';
    }
    return 'week';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const BUCKET = /^(\d{4})(?:-(Q|W)?(\d{1,2}))?$/;

function partsOfBucket(bucket: string): { year: string; kind?: string; part?: number } | undefined {
    // A year can match without any of the optional groups.
    const found: (string | undefined)[] | null = BUCKET.exec(bucket);
    if (found === null) {
        return undefined;
    }
    const part = found[3];
    return { year: found[1] ?? bucket, kind: found[2], part: part === undefined ? undefined : Number(part) };
}

export function bucketLabel(bucket: string): string {
    const parts = partsOfBucket(bucket);
    if (parts?.part === undefined) {
        return bucket;
    }
    if (parts.kind === 'Q') {
        return `Q${parts.part} ${parts.year}`;
    }
    return parts.kind === 'W' ? `Week ${parts.part}, ${parts.year}` : `${MONTHS[parts.part - 1]} ${parts.year}`;
}

export function bucketTick(bucket: string, index: number, total: number): string {
    const every = Math.max(1, Math.ceil(total / 12));
    if (index % every !== 0) {
        return '';
    }
    const parts = partsOfBucket(bucket);
    if (parts?.part === undefined) {
        return parts === undefined ? bucket : parts.year;
    }
    if (parts.kind === 'Q') {
        return parts.part === 1 || every > 1 ? `${parts.year} Q${parts.part}` : `Q${parts.part}`;
    }
    const year = parts.year.slice(2);
    return parts.kind === 'W' ? `W${parts.part} ${year}` : `${MONTHS[parts.part - 1]} ${year}`;
}

export function formatDate(value: IsoDate | null | undefined): string {
    return value === null || value === undefined ? '–' : dayjs.utc(value).format('D MMM YYYY');
}

export function formatLongDate(value: IsoDate | null | undefined): string {
    return value === null || value === undefined ? '–' : dayjs.utc(value).format('D MMMM YYYY');
}

/**
 * Says when a bound of the collection dates lies, given as the range that it is known to: on a day, in a whole
 * calendar month or year, and otherwise between two days.
 */
export function collectionBoundPhrase(lower: IsoDate, upper: IsoDate | null | undefined): string {
    if (upper === null || upper === undefined || upper === lower) {
        return `on ${formatLongDate(lower)}`;
    }
    const from = dayjs.utc(lower);
    const to = dayjs.utc(upper);
    const isWhole = (unit: 'month' | 'year') =>
        from.isSame(from.startOf(unit), 'day') && to.isSame(from.endOf(unit), 'day');
    if (isWhole('year')) {
        return `in ${from.format('YYYY')}`;
    }
    if (isWhole('month')) {
        return `in ${from.format('MMMM YYYY')}`;
    }
    const start = from.year() === to.year() ? from.format('D MMMM') : from.format('D MMMM YYYY');
    return `between ${start} and ${to.format('D MMMM YYYY')}`;
}

export function coarserGranularity(granularity: Granularity): Granularity | undefined {
    const index = GRANULARITIES.indexOf(granularity);
    return index > 0 ? GRANULARITIES[index - 1] : undefined;
}
