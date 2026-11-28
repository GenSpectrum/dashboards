import { describe, expect, test } from 'vitest';

import { baselineFloor } from './useLineage.ts';
import type { RhydbRow } from '../transport/row.ts';

function profileRow(count: number, coverage: number): RhydbRow {
    return {
        mutationFrom: 'A',
        mutationTo: 'T',
        sequenceName: 'OPG001',
        position: 10,
        count,
        coverage,
        proportion: count / coverage,
    };
}

describe('the floor that the pathogen-wide mutation query asks from', () => {
    test("is the rarest of the lineage's own changes, over every sequence that the pathogen has", () => {
        const rows = [profileRow(900, 1000), profileRow(67, 100), profileRow(400, 500)];
        expect(baselineFloor(rows, 15580)).toBeCloseTo((67 / 15580) * 0.99, 10);
    });

    test("ignores the changes that are not the lineage's own", () => {
        const rows = [profileRow(900, 1000), profileRow(5, 100)];
        expect(baselineFloor(rows, 10000)).toBeCloseTo((900 / 10000) * 0.99, 10);
    });

    test('asks only for what every sequence carries where the lineage has no change of its own', () => {
        expect(baselineFloor([profileRow(10, 100)], 10000)).toBe(1);
    });

    test('waits for what it is counted against', () => {
        expect(baselineFloor(undefined, 10000)).toBeUndefined();
        expect(baselineFloor([profileRow(900, 1000)], undefined)).toBeUndefined();
    });

    test('is never above every sequence', () => {
        expect(baselineFloor([profileRow(900, 1000)], 100)).toBe(1);
    });
});
