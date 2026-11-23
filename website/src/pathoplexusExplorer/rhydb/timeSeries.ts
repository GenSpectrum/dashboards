/** Group by each recorded date range before assigning it to a chart bucket. */

import {
    autoGranularity,
    bucketOfRange,
    bucketsBetween,
    coarserGranularity,
    type Granularity,
} from '../domain/dates.ts';
import { COLUMNS } from './queries/scope.ts';
import type { RhydbRow } from './transport/row.ts';

const EARLY_OUTLIER_SHARE = 0.005;

/** Ignore the earliest fraction of dated entries when choosing the start of an open-ended axis. */
function robustStart(rows: readonly RhydbRow[]): string | undefined {
    const dated = rows
        .map((row) => ({ lower: (row[COLUMNS.lower] ?? null) as string | null, n: Number(row.n ?? 0) }))
        .filter((entry): entry is { lower: string; n: number } => entry.lower !== null)
        .sort((a, b) => a.lower.localeCompare(b.lower));
    const total = dated.reduce((sum, entry) => sum + entry.n, 0);
    let seen = 0;
    for (const entry of dated) {
        seen += entry.n;
        if (seen > total * EARLY_OUTLIER_SHARE) {
            return entry.lower;
        }
    }
    return dated.at(-1)?.lower;
}

function dateExtent(rows: readonly RhydbRow[]): { from?: string; to?: string } {
    let from: string | undefined;
    let to: string | undefined;
    for (const row of rows) {
        const lower = (row[COLUMNS.lower] ?? null) as string | null;
        const upper = (row[COLUMNS.upper] ?? null) as string | null;
        if (lower !== null && upper !== null) {
            from = from === undefined || lower < from ? lower : from;
            to = to === undefined || upper > to ? upper : to;
        }
    }
    return { from, to };
}

const MIN_PLACEABLE = 0.5;

function placeableProportion(rows: readonly RhydbRow[], granularity: Granularity): number {
    let dated = 0;
    let placed = 0;
    for (const row of rows) {
        const lower = (row[COLUMNS.lower] ?? null) as string | null;
        const upper = (row[COLUMNS.upper] ?? null) as string | null;
        if (lower === null || upper === null) {
            continue;
        }
        const n = Number(row.n ?? 0);
        dated += n;
        if (bucketOfRange(lower, upper, granularity) !== undefined) {
            placed += n;
        }
    }
    return dated === 0 ? 1 : placed / dated;
}

/** Choose a coarser automatic resolution when too few date ranges fit in one bucket. */
export function autoGranularityFor(rows: readonly RhydbRow[], from: string, to: string): Granularity {
    let granularity = autoGranularity(from, to);
    for (;;) {
        if (placeableProportion(rows, granularity) >= MIN_PLACEABLE) {
            return granularity;
        }
        const coarser = coarserGranularity(granularity);
        if (coarser === undefined) {
            return granularity;
        }
        granularity = coarser;
    }
}

const MAX_BUCKETS = 48;

export function bucketAxisOf(options: {
    rows: readonly RhydbRow[];
    granularity?: Granularity;
}): { buckets: string[]; granularity: Granularity } | undefined {
    const { rows, granularity } = options;
    const extent = dateExtent(rows);
    const start = robustStart(rows) ?? extent.from;
    const end = extent.to;
    if (start === undefined || end === undefined || start > end) {
        return undefined;
    }
    let resolved = granularity ?? autoGranularityFor(rows, start, end);
    let buckets = bucketsBetween(start, end, resolved);
    while (buckets.length > MAX_BUCKETS) {
        const coarser = coarserGranularity(resolved);
        if (coarser === undefined) {
            return { buckets: buckets.slice(-MAX_BUCKETS), granularity: resolved };
        }
        resolved = coarser;
        buckets = bucketsBetween(start, end, resolved);
    }
    return { buckets, granularity: resolved };
}

/** Count dated ranges only where they fit within a single bucket. */
export function countsPerBucket(
    rows: readonly RhydbRow[],
    buckets: readonly string[],
    granularity: Granularity,
): { counts: number[]; undated: number; imprecise: number; offAxis: number } {
    const index = new Map(buckets.map((bucket, position) => [bucket, position]));
    const counts = buckets.map(() => 0);
    let undated = 0;
    let imprecise = 0;
    let offAxis = 0;
    for (const row of rows) {
        const n = Number(row.n ?? 0);
        const lower = (row[COLUMNS.lower] ?? null) as string | null;
        if (lower === null) {
            undated += n;
            continue;
        }
        const bucket = bucketOfRange(lower, (row[COLUMNS.upper] ?? null) as string | null, granularity);
        if (bucket === undefined) {
            imprecise += n;
            continue;
        }
        const position = index.get(bucket);
        if (position === undefined) {
            offAxis += n;
            continue;
        }
        counts[position] += n;
    }
    return { counts, undated, imprecise, offAxis };
}

export function trimEmptyBuckets(
    rows: readonly RhydbRow[],
    axis: { buckets: string[]; granularity: Granularity },
): { buckets: string[]; granularity: Granularity } {
    const { counts } = countsPerBucket(rows, axis.buckets, axis.granularity);
    const first = counts.findIndex((count) => count > 0);
    if (first < 0) {
        return axis;
    }
    let last = counts.length - 1;
    while (last > first && counts[last] === 0) {
        last--;
    }
    return { buckets: axis.buckets.slice(first, last + 1), granularity: axis.granularity };
}
