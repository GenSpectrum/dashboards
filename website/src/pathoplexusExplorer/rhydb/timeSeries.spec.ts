import { expect, test } from 'vitest';

import { autoGranularityFor, bucketAxisOf, countsPerBucket, trimEmptyBuckets } from './timeSeries.ts';
import { autoGranularity } from '../domain/dates.ts';

test('the automatic resolution coarsens until most sequences can be placed', () => {
    const yearly = [
        { sampleCollectionDateRangeLower: '2007-01-01', sampleCollectionDateRangeUpper: '2007-12-31', n: 18 },
        { sampleCollectionDateRangeLower: '2008-01-01', sampleCollectionDateRangeUpper: '2008-12-31', n: 6 },
    ];
    expect(autoGranularity('2007-01-01', '2008-12-31')).toBe('month');
    expect(autoGranularityFor(yearly, '2007-01-01', '2008-12-31')).toBe('year');
});

test('the automatic resolution stays fine where most dates are exact', () => {
    const daily = [
        { sampleCollectionDateRangeLower: '2024-01-03', sampleCollectionDateRangeUpper: '2024-01-03', n: 60 },
        { sampleCollectionDateRangeLower: '2024-01-01', sampleCollectionDateRangeUpper: '2024-12-31', n: 40 },
    ];
    expect(autoGranularityFor(daily, '2024-01-01', '2025-06-30')).toBe('month');
});

const row = (lower: string | null, upper: string | null, n: number) => ({
    sampleCollectionDateRangeLower: lower,
    sampleCollectionDateRangeUpper: upper,
    n,
});

test('the axis spans the dates the rows hold, in the granularity asked for', () => {
    const axis = bucketAxisOf({
        rows: [row('2024-01-15', '2024-01-15', 5), row('2024-03-02', '2024-03-02', 7)],
        granularity: 'month',
    });

    expect(axis).toEqual({ buckets: ['2024-01', '2024-02', '2024-03'], granularity: 'month' });
});

test('an axis of rows without a usable date is no axis at all', () => {
    expect(bucketAxisOf({ rows: [row(null, null, 9)], granularity: 'month' })).toBeUndefined();
});

test('a sequence is counted in its bucket, or counted apart with the reason it could not be placed', () => {
    const counted = countsPerBucket(
        [
            row('2024-01-15', '2024-01-15', 5),
            row('2024-02-04', '2024-02-04', 3),
            row(null, '2024-02-04', 2),
            row('2024-01-01', '2024-12-31', 4),
            row('2023-05-05', '2023-05-05', 6),
        ],
        ['2024-01', '2024-02'],
        'month',
    );

    expect(counted).toEqual({ counts: [5, 3], undated: 2, imprecise: 4, offAxis: 6 });
});

test('the empty periods at the ends of an axis are dropped, and the gaps between kept', () => {
    const axis = { buckets: ['2023-11', '2023-12', '2024-01', '2024-02'], granularity: 'month' as const };
    const rows = [row('2023-12-01', '2023-12-01', 1), row('2024-02-10', '2024-02-10', 2)];

    expect(trimEmptyBuckets(rows, axis).buckets).toEqual(['2023-12', '2024-01', '2024-02']);
});

test('an axis no sequence falls in is left as it is, rather than trimmed away', () => {
    const axis = { buckets: ['2024-01', '2024-02'], granularity: 'month' as const };

    expect(trimEmptyBuckets([row(null, null, 3)], axis)).toEqual(axis);
});
