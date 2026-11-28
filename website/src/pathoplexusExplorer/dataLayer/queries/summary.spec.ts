import { expect, test } from 'vitest';

import { areaScale, counted, divisionCount, geographicTotal, rankAreas } from './areas.ts';
import { collectionBoundsOf, summaryOf } from './summary.ts';

test('all sequences contribute to the total, country aliases count once, and group IDs survive renames', () => {
    const places = [
        { geoLocCountry: 'Brazil', n: 8 },
        { geoLocCountry: 'Zaire', n: 2 },
        { geoLocCountry: 'Democratic Republic of the Congo', n: 4 },
        { geoLocCountry: 'Pacific Ocean', n: 1 },
        { geoLocCountry: 'Uganda', n: 0 },
    ];
    const groups = [
        { groupId: 0, groupName: 'First name', n: 2 },
        { groupId: 0, groupName: 'Second name', n: 8 },
        { groupId: 1, groupName: 'Second name', n: 2 },
        { groupId: 2, n: 0 },
        { groupId: null, n: 3 },
    ];
    const world = { level: 'world' } as const;
    expect(geographicTotal(world, places)).toBe(15);
    expect(
        rankAreas(areaScale(world), counted(places))
            .filter((area) => area.own > 0)
            .map(({ name, own }) => [name, own]),
    ).toEqual([
        ['Brazil', 8],
        ['Democratic Republic of the Congo', 6],
    ]);
    expect(summaryOf(places, groups)).toEqual({ n: 15, countries: 2, groups: 2 });
});

test('the four bounds are independent and only include entries with collection dates', () => {
    const dated = (lower: string | null, upper: string | null, n = 1) => ({
        sampleCollectionDateRangeLower: lower,
        sampleCollectionDateRangeUpper: upper,
        n,
    });
    const undated = dated(null, '2026-03-04');
    expect(collectionBoundsOf([undated])).toBeNull();
    const known = dated('2024-09-01', '2024-12-31');
    expect(collectionBoundsOf([known, dated('2025-01-01', null)])).toBeNull();
    expect(collectionBoundsOf([dated('2025-01-01', '2024-01-01'), known])).toBeNull();
    expect(
        collectionBoundsOf([
            undated,
            dated('2020-01-01', '2020-12-31'),
            dated('2020-03-01', '2020-03-01'),
            dated('2024-01-01', '2024-12-31'),
            known,
            dated('1990-01-01', '1990-01-01', 0),
        ]),
    ).toEqual({ firstFrom: '2020-01-01', firstTo: '2020-03-01', lastFrom: '2024-09-01', lastTo: '2024-12-31' });
});

test('the administrative count requires identifiable divisions in the selected country', () => {
    const portugal = { level: 'country', country: 'Portugal' } as const;
    const imported = [{ geoLocCountry: 'Portugal', geoLocAdmin1: 'imported from Brazil', n: 12 }];
    expect(divisionCount(portugal.country, imported)).toBeUndefined();
    expect(rankAreas(areaScale(portugal), counted(imported))).toEqual([]);
    expect(geographicTotal(portugal, imported)).toBe(12);
    expect(
        divisionCount('Brazil', [
            { geoLocCountry: 'Brazil', geoLocAdmin1: 'RJ', n: 2 },
            { geoLocCountry: 'Brazil', geoLocAdmin1: 'Rio de Janeiro', n: 3 },
            { geoLocCountry: 'Brazil', geoLocAdmin1: 'imported', n: 1 },
        ]),
    ).toBe(1);
});
