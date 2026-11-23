import { describe, expect, test } from 'vitest';

import {
    autoGranularity,
    bucketOf,
    bucketOfRange,
    bucketsBetween,
    collectionBoundPhrase,
    isIsoDate,
    parsePeriodKey,
    periodKey,
} from './dates.ts';

describe('buckets', () => {
    test('a day falls in one bucket per granularity', () => {
        expect(bucketOf('2024-07-15', 'year')).toBe('2024');
        expect(bucketOf('2024-07-15', 'quarter')).toBe('2024-Q3');
        expect(bucketOf('2024-07-15', 'month')).toBe('2024-07');
        expect(bucketOf('2024-07-15', 'week')).toBe('2024-W29');
    });

    test('ISO weeks belong to the year of their Thursday', () => {
        expect(bucketOf('2021-01-01', 'week')).toBe('2020-W53');
        expect(bucketOf('2019-12-30', 'week')).toBe('2020-W01');
    });

    test('a range is counted only where it fits one bucket', () => {
        expect(bucketOfRange('2024-01-01', '2024-12-31', 'year')).toBe('2024');
        expect(bucketOfRange('2024-01-01', '2024-12-31', 'month')).toBeUndefined();
        expect(bucketOfRange('2024-03-01', '2024-03-31', 'month')).toBe('2024-03');
        expect(bucketOfRange(null, '2024-03-31', 'month')).toBeUndefined();
    });

    test('every bucket between two dates, gaps included', () => {
        expect(bucketsBetween('1900-06-01', '2026-02-01', 'year')).toHaveLength(127);
        expect(bucketsBetween('2023-11-15', '2024-02-01', 'month')).toEqual([
            '2023-11',
            '2023-12',
            '2024-01',
            '2024-02',
        ]);
        expect(bucketsBetween('2024-12-20', '2025-01-10', 'week')).toEqual([
            '2024-W51',
            '2024-W52',
            '2025-W01',
            '2025-W02',
        ]);
        expect(bucketsBetween('2023-02-01', '2023-09-01', 'quarter')).toEqual(['2023-Q1', '2023-Q2', '2023-Q3']);
    });

    test('the automatic granularity follows the span', () => {
        expect(autoGranularity('2026-01-01', '2026-10-01')).toBe('week');
        expect(autoGranularity('2023-01-01', '2026-10-01')).toBe('month');
        expect(autoGranularity('2018-01-01', '2026-10-01')).toBe('quarter');
        expect(autoGranularity('1990-01-01', '2026-10-01')).toBe('year');
    });
});

test('a bound of the collection dates is a day, a whole month or year, or else the range that it is known to', () => {
    expect(collectionBoundPhrase('2025-10-03', '2025-10-03')).toBe('on 3 October 2025');
    expect(collectionBoundPhrase('2025-10-03', null)).toBe('on 3 October 2025');
    expect(collectionBoundPhrase('2025-10-01', '2025-10-31')).toBe('in October 2025');
    expect(collectionBoundPhrase('2024-02-01', '2024-02-29')).toBe('in February 2024');
    expect(collectionBoundPhrase('2025-01-01', '2025-12-31')).toBe('in 2025');
    expect(collectionBoundPhrase('2025-10-03', '2025-12-31')).toBe('between 3 October and 31 December 2025');
    expect(collectionBoundPhrase('2024-06-20', '2025-02-15')).toBe('between 20 June 2024 and 15 February 2025');
    expect(collectionBoundPhrase('2024-01-01', '2025-12-31')).toBe('between 1 January 2024 and 31 December 2025');
});

describe('a date read from an address', () => {
    test('is a date only where the calendar holds it', () => {
        expect(isIsoDate('2021-06-30')).toBe(true);
        expect(isIsoDate('2020-02-29')).toBe(true);
        expect(isIsoDate('2021-06-31')).toBe(false);
        expect(isIsoDate('2021-02-30')).toBe(false);
        expect(isIsoDate('2021-13-40')).toBe(false);
        expect(isIsoDate('0090-01-01')).toBe(false);
        expect(isIsoDate('2021-06')).toBe(false);
        expect(isIsoDate('yesterday')).toBe(false);
    });
});

test('a period is written as an ISO 8601 interval, with an open end written as two dots', () => {
    expect(periodKey({ from: '2024-01-01', to: '2024-12-31' })).toBe('2024-01-01/2024-12-31');
    expect(periodKey({ from: '2024-01-01' })).toBe('2024-01-01/..');
    expect(periodKey({ to: '2024-12-31' })).toBe('../2024-12-31');
    expect(periodKey({})).toBeUndefined();
    for (const period of [{ from: '2024-01-01', to: '2024-12-31' }, { from: '2024-01-01' }, { to: '2024-12-31' }]) {
        expect(parsePeriodKey(periodKey(period) ?? null)).toEqual(period);
    }
});

test('an interval that is not one leaves the period open', () => {
    expect(parsePeriodKey(null)).toEqual({});
    expect(parsePeriodKey('2024-01-01')).toEqual({});
    expect(parsePeriodKey('2024-01-01/2024-02-30')).toEqual({ from: '2024-01-01' });
    expect(parsePeriodKey('a/b/c')).toEqual({});
});
