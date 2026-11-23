import { describe, expect, test } from 'vitest';

import { dimensionById, dimensionsFor, labelOf, NOTHING, type Dimension, type ValuesLookup } from './dimensions.ts';
import { defined } from '../defined.fixture.ts';
import { CATALOG } from '../domain/catalog.ts';
import { allPathogens } from '../domain/subject.ts';
import { COLUMNS } from '../rhydb/queries/scope.ts';
import type { RhydbRow } from '../rhydb/transport/row.ts';

const EVERY_TABLE = allPathogens(CATALOG).map((pathogen) => pathogen.table);

function dimension(id: string, tables: readonly string[] = EVERY_TABLE): Dimension {
    return defined(dimensionById(dimensionsFor({ catalog: CATALOG, tables }), id), `the ${id} dimension`);
}

const LOOKUP: ValuesLookup = {
    countries: ['Brazil', 'Zaire', 'Not applicable', null],
    hosts: [
        { name: 'Homo sapiens', taxon: '9606' },
        { name: 'Aedes aegypti', taxon: '7159' },
        { name: 'Corvus brachyrhynchos', taxon: '85066' },
        { name: null, taxon: null },
    ],
    subtypes: { clade: ['Ia', 'Ib', 'None', null] },
};

describe('the country dimension', () => {
    const country = dimension('country');

    test("counts a historical name under today's country", () => {
        expect(country.valueOf({ [COLUMNS.country]: 'Zaire' })).toBe('Democratic Republic of the Congo');
    });

    test('counts a value that records nothing as recording nothing', () => {
        expect(country.valueOf({ [COLUMNS.country]: 'not applicable' })).toBe(NOTHING);
        expect(country.valueOf({ [COLUMNS.country]: null })).toBe(NOTHING);
        expect(labelOf(country, NOTHING)).toBe('Not recorded');
    });

    test('keeps the rows it counted, under every spelling that the data holds', () => {
        const filter = country.filterOf?.(['Democratic Republic of the Congo'], LOOKUP);
        expect(filter?.render()).toContain("'Zaire'");
    });

    test('names the spellings that record nothing, rather than repeating the rule in the query', () => {
        expect(country.filterOf?.([NOTHING], LOOKUP)?.render()).toBe(
            "isNull(geoLocCountry) || geoLocCountry = 'Not applicable'",
        );
    });
});

describe('the host group dimension', () => {
    const host = dimension('host');
    const row = (name: string | null, taxon: string | null): RhydbRow => ({
        [COLUMNS.host]: name,
        [COLUMNS.hostTaxon]: taxon,
    });

    test('places a host by its taxon, as a report does', () => {
        expect(host.valueOf(row('Homo sapiens', '9606'))).toBe('human');
        expect(host.valueOf(row('Aedes aegypti', '7159'))).toBe('vector');
        expect(host.valueOf(row('Corvus brachyrhynchos', '85066'))).toBe('animal');
        expect(host.valueOf(row(null, null))).toBe('unknown');
    });

    test('keeps exactly the hosts that reading places in the chosen group', () => {
        expect(host.filterOf?.(['vector'], LOOKUP)?.render()).toBe("hostNameScientific = 'Aedes aegypti'");
    });

    test('selects the rows recording no host at all for the group they are counted in', () => {
        expect(host.filterOf?.(['unknown'], LOOKUP)?.render()).toBe('isNull(hostNameScientific)');
    });

    test('keeps nothing where the data holds no host of the group', () => {
        expect(host.filterOf?.(['unclassified'], LOOKUP)?.render()).toBe('false');
    });

    test('names each group, and leaves a value that is no group as it is written', () => {
        expect(labelOf(host, 'vector')).toBe('Arthropod');
        expect(labelOf(host, 'made up')).toBe('made up');
    });
});

describe('the collection year dimension', () => {
    const year = dimension('year');
    const row = (lower: string | null, upper: string | null): RhydbRow => ({
        [COLUMNS.lower]: lower,
        [COLUMNS.upper]: upper,
    });

    test('counts a sequence under its year only where its whole range lies in one', () => {
        expect(year.valueOf(row('2024-03-02', '2024-03-02'))).toBe('2024');
        expect(year.valueOf(row('2024-01-01', '2024-12-31'))).toBe('2024');
        expect(year.valueOf(row('2023-06-01', '2024-05-31'))).toBe(NOTHING);
        expect(year.valueOf(row(null, '2024-05-31'))).toBe(NOTHING);
        expect(labelOf(year, NOTHING)).toBe('No collection year');
    });

    test('asks for the whole range to lie inside the year chosen', () => {
        expect(year.filterOf?.(['2024'], LOOKUP)?.render()).toBe(
            "sampleCollectionDateRangeLower >= '2024-01-01'::date && sampleCollectionDateRangeUpper <= '2024-12-31'::date",
        );
    });

    test('keeps the sequences with no collection date among those with no year', () => {
        const filter = year.filterOf?.([NOTHING], LOOKUP)?.render() ?? '';
        expect(filter).toContain('isNull(sampleCollectionDateRangeLower)');
        expect(filter).toContain('isNull(sampleCollectionDateRangeUpper)');
    });

    test('offers the most recent year first', () => {
        expect(year.order?.('2024', '2023')).toBeLessThan(0);
    });
});

describe('the subtype levels of one pathogen', () => {
    test('are offered once the selection leaves one pathogen, and not before', () => {
        expect(dimensionById(dimensionsFor({ catalog: CATALOG, tables: EVERY_TABLE }), 'level:clade')).toBeUndefined();
        expect(dimensionById(dimensionsFor({ catalog: CATALOG, tables: ['mpox'] }), 'level:clade')).toBeDefined();
    });

    test('are left out where the instance has no such column', () => {
        const dimensions = dimensionsFor({
            catalog: CATALOG,
            tables: ['mpox'],
            hasColumn: (_table, column) => column !== 'clade',
        });
        expect(dimensionById(dimensions, 'level:clade')).toBeUndefined();
    });

    test('count a lineage that is assigned to nothing as unassigned', () => {
        const clade = dimension('level:clade', ['mpox']);
        expect(clade.valueOf({ clade: 'None' })).toBe(NOTHING);
        expect(clade.valueOf({ clade: null })).toBe(NOTHING);
        expect(labelOf(clade, NOTHING)).toBe('Unassigned');
        expect(clade.filterOf?.([NOTHING], LOOKUP)?.render()).toBe("isNull(clade) || clade = 'None'");
    });
});

describe('the pathogen dimension', () => {
    const pathogen = dimension('pathogen');

    test('calls a table by the name that the catalog gives it', () => {
        expect(labelOf(pathogen, 'mpox')).toBe('Mpox');
    });

    test('selects whole tables rather than rows', () => {
        expect(pathogen.tablesOf?.(['mpox'], EVERY_TABLE)).toEqual(['mpox']);
        expect(pathogen.filterOf).toBeUndefined();
    });
});

describe('the province or state dimension', () => {
    const provinces = (country: string) =>
        dimensionById(dimensionsFor({ catalog: CATALOG, tables: EVERY_TABLE, country }), 'admin1');
    const illinois: ValuesLookup = {
        ...LOOKUP,
        admin1Names: ['Illinois', 'Illinois, Cook County', 'IL', 'Texas', 'not applicable', null],
    };

    test('is offered for a country whose divisions are known, and for no other', () => {
        expect(provinces('USA')?.label).toBe('Province or state');
        expect(provinces('Vatican City')).toBeUndefined();
        expect(dimensionById(dimensionsFor({ catalog: CATALOG, tables: EVERY_TABLE }), 'admin1')).toBeUndefined();
    });

    test('counts every way that a division is written as that division', () => {
        const usa = defined(provinces('USA'), 'the USA province dimension');
        expect(usa.valueOf({ [COLUMNS.admin1]: 'Illinois, Cook County' })).toBe('Illinois');
        expect(usa.valueOf({ [COLUMNS.admin1]: 'Dallas Co. TX' })).toBe('Texas');
        expect(usa.valueOf({ [COLUMNS.admin1]: null })).toBe(NOTHING);
        expect(labelOf(usa, NOTHING)).toBe('Not recorded');
    });

    test('keeps exactly the rows it counted, by naming the spellings that the country holds', () => {
        const usa = defined(provinces('USA'), 'the USA province dimension');
        const filter = usa.filterOf?.(['Illinois'], illinois)?.render();
        expect(filter).toContain("'Illinois, Cook County'");
        expect(filter).toContain("'IL'");
        expect(filter).not.toContain("'Texas'");
    });

    test('the unrecorded division keeps the placeholder spellings that it counted', () => {
        const usa = defined(provinces('USA'), 'the USA province dimension');
        expect(usa.valueOf({ [COLUMNS.admin1]: 'not applicable' })).toBe(NOTHING);
        expect(usa.filterOf?.([NOTHING], illinois)?.render()).toBe(
            "geoLocAdmin1 = 'not applicable' || isNull(geoLocAdmin1)",
        );
    });

    test('a division that nothing in the country is recorded under keeps nothing', () => {
        const usa = defined(provinces('USA'), 'the USA province dimension');
        expect(usa.filterOf?.(['Nowhere'], illinois)?.render()).toBe('false');
    });

    test('the rows recording nothing are the ones no division places', () => {
        const usa = defined(provinces('USA'), 'the USA province dimension');
        const filter = usa.filterOf?.([NOTHING], illinois)?.render();
        expect(filter).toContain('isNull(geoLocAdmin1)');
        expect(filter).toContain("'not applicable'");
    });
});

describe('the host dimension, by name', () => {
    const hostName = dimension('hostName');

    test('is the name as the column holds it, and says so where nothing is recorded', () => {
        expect(hostName.valueOf({ [COLUMNS.host]: 'Aedes aegypti' })).toBe('Aedes aegypti');
        expect(hostName.valueOf({ [COLUMNS.host]: '   ' })).toBe(NOTHING);
        expect(hostName.valueOf({ [COLUMNS.host]: null })).toBe(NOTHING);
        expect(labelOf(hostName, NOTHING)).toBe('Host not recorded');
    });

    test('keeps the rows it counted, the blank names among them', () => {
        expect(hostName.filterOf?.(['Aedes aegypti'], LOOKUP)?.render()).toBe("hostNameScientific = 'Aedes aegypti'");
        const nothing = hostName.filterOf?.([NOTHING], { hosts: [{ name: ' ', taxon: null }] })?.render();
        expect(nothing).toBe("isNull(hostNameScientific) || hostNameScientific = ' '");
    });
});

describe('the pathogen group dimension', () => {
    const groups = dimension('pathogenGroup');

    test('is a filter and not an axis, because a pathogen is in a group and in a family at once', () => {
        expect(groups.axis).toBe(false);
        expect(groups.valuesOf?.({ organism: 'rsv_a' })).toEqual(['respiratory', 'rsv']);
        expect(groups.valuesOf?.({ organism: 'mpox' })).toEqual([]);
    });

    test('labels the groups the way the report bar does', () => {
        expect(labelOf(groups, 'respiratory')).toBe('All respiratory');
        expect(labelOf(groups, 'rsv')).toBe('All RSV');
        expect(groups.depthOf?.('rsv')).toBe(1);
        expect(groups.depthOf?.('respiratory')).toBe(0);
    });

    test('keeps the tables under what is chosen', () => {
        expect(groups.tablesOf?.(['rsv'], EVERY_TABLE)).toEqual(['rsv_a', 'rsv_b']);
        expect(groups.tablesOf?.(['ebola'], EVERY_TABLE)).toEqual(['ebola_zaire', 'ebola_sudan', 'ebola_bdbv']);
        expect(groups.tablesOf?.(['respiratory'], EVERY_TABLE)).toContain('measles');
        expect(groups.tablesOf?.(['respiratory'], EVERY_TABLE)).not.toContain('dengue');
    });
});
