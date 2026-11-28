import { describe, expect, test } from 'vitest';

import { dimensionsFor, NOTHING, type ValuesLookup } from './dimensions.ts';
import { compileSelection, PERIOD, tablesInScope, type Constraints } from './selection.ts';
import { CATALOG } from '../../domain/catalog.ts';
import { allPathogens } from '../../domain/subject.ts';

/* eslint-disable @typescript-eslint/naming-convention -- the keys are dimension IDs */

const TABLES = allPathogens(CATALOG).map((pathogen) => pathogen.table);
const DIMENSIONS = dimensionsFor({ catalog: CATALOG, tables: TABLES });
const LOOKUP: ValuesLookup = {
    countries: ['Brazil', 'Zaire', 'unknown', null],
    hosts: [{ name: 'Homo sapiens', taxon: '9606' }],
    subtypes: { lineage: ['A.D'] },
};

function compile(dimensions: Constraints, skip?: string) {
    return compileSelection({
        selection: { dimensions, period: {} },
        dimensions: DIMENSIONS,
        tables: TABLES,
        lookup: LOOKUP,
        skip,
    });
}

describe('a selection compiled to a query', () => {
    test('keeps every table and filters nothing where nothing is chosen', () => {
        const compiled = compile({});
        expect(compiled.tables).toEqual(TABLES);
        expect(compiled.filter('mpox')).toBeUndefined();
    });

    test('narrows to the tables of the pathogens chosen, or leaves out those excluded', () => {
        expect(compile({ pathogen: { values: ['mpox'] } }).tables).toEqual(['mpox']);
        expect(compile({ pathogen: { values: ['mpox'], exclude: true } }).tables).toEqual(
            TABLES.filter((table) => table !== 'mpox'),
        );
    });

    test('chooses the tables by the pathogen and the pathogen group together', () => {
        const constraints = { pathogen: { values: ['rsv_a'] }, pathogenGroup: { values: ['rsv'], exclude: true } };
        expect(tablesInScope({ constraints, dimensions: DIMENSIONS, tables: TABLES })).toEqual([]);
        expect(
            tablesInScope({
                constraints: { pathogenGroup: { values: ['rsv'] } },
                dimensions: DIMENSIONS,
                tables: TABLES,
            }),
        ).toEqual(['rsv_a', 'rsv_b']);
    });

    test('gathers a country under every name it is recorded under', () => {
        const filter = compile({ country: { values: ['Democratic Republic of the Congo'] } }).filter('mpox');
        expect(filter?.render()).toContain("'Zaire'");
    });

    test('negates the values of an inverted dimension', () => {
        expect(
            compile({ country: { values: ['Brazil'], exclude: true } })
                .filter('mpox')
                ?.render(),
        ).toBe("!(isNotNull(geoLocCountry) && geoLocCountry = 'Brazil')");
    });

    test('names the spellings that record no country at all', () => {
        expect(
            compile({ country: { values: [NOTHING] } })
                .filter('mpox')
                ?.render(),
        ).toBe("isNull(geoLocCountry) || geoLocCountry = 'unknown'");
    });

    test('asks for a collection period', () => {
        const selection = { dimensions: {}, period: { from: '2024-01-01', to: '2024-12-31' } };
        expect(
            compileSelection({ selection, dimensions: DIMENSIONS, tables: TABLES, lookup: LOOKUP })
                .filter('mpox')
                ?.render(),
        ).toBe(
            "sampleCollectionDateRangeLower >= '2024-01-01'::date && sampleCollectionDateRangeUpper <= '2024-12-31'::date",
        );
    });

    test('leaves out a submitting group that is not a group ID', () => {
        expect(
            compile({ group: { values: ['abc'] }, country: { values: ['Brazil'] } })
                .filter('mpox')
                ?.render(),
        ).toBe("isNotNull(geoLocCountry) && geoLocCountry = 'Brazil'");
    });

    test('cannot be broken by any value', () => {
        const garbage = ['abc', '', '-1', '1e3', '\u0000x', "it's", '(none)'];
        for (const dimension of DIMENSIONS) {
            expect(() =>
                compile({ [dimension.id]: { values: garbage } })
                    .filter('mpox')
                    ?.render(),
            ).not.toThrow();
            expect(() => compile({ [dimension.id]: { values: garbage, exclude: true } }).filter('mpox')).not.toThrow();
        }
    });
});

describe('the selection that a filter counts its values in', () => {
    test('leaves out the dimension of the filter, and only that one', () => {
        const filter = compile({ country: { values: ['Brazil'] }, host: { values: ['human'] } }, 'country')
            .filter('mpox')
            ?.render();
        expect(filter).not.toContain('Brazil');
        expect(filter).toContain('hostNameScientific');
    });

    test('leaves out the period on the timeline', () => {
        const selection = { dimensions: {}, period: { from: '2024-01-01' } };
        expect(
            compileSelection({
                selection,
                dimensions: DIMENSIONS,
                tables: TABLES,
                lookup: LOOKUP,
                skip: PERIOD,
            }).filter('mpox'),
        ).toBeUndefined();
    });

    test('leaves out the subtype levels with the pathogen that they belong to', () => {
        const dimensions = dimensionsFor({ catalog: CATALOG, tables: ['mpox'] });
        const compiled = compileSelection({
            selection: {
                dimensions: { 'pathogen': { values: ['mpox'] }, 'level:clade': { values: ['Ib'] } },
                period: {},
            },
            dimensions,
            tables: TABLES,
            lookup: LOOKUP,
            skip: 'pathogen',
        });
        expect(compiled.tables).toEqual(TABLES);
        expect(compiled.filter('mpox')).toBeUndefined();
    });

    test('leaves out the subtype levels with the pathogen group that kept their pathogen', () => {
        const dimensions = dimensionsFor({ catalog: CATALOG, tables: ['rsv_a'] });
        const chosen = {
            'pathogen': { values: ['rsv_a', 'ebola_sudan'] },
            'pathogenGroup': { values: ['rsv'] },
            'level:lineage': { values: ['A.D'] },
        };
        const options = { selection: { dimensions: chosen, period: {} }, dimensions, tables: TABLES, lookup: LOOKUP };
        const forGroups = compileSelection({ ...options, skip: 'pathogenGroup' });
        expect(forGroups.tables).toEqual(['rsv_a', 'ebola_sudan']);
        expect(forGroups.filter('ebola_sudan')).toBeUndefined();
        expect(compileSelection(options).filter('rsv_a')?.render()).toContain('lineage');
    });

    test('leaves out the province with the country that it lies in', () => {
        const dimensions = dimensionsFor({ catalog: CATALOG, tables: TABLES, country: 'USA' });
        const options = {
            selection: { dimensions: { country: { values: ['USA'] }, admin1: { values: ['Illinois'] } }, period: {} },
            dimensions,
            tables: TABLES,
            lookup: { ...LOOKUP, admin1Names: ['Illinois'] },
        };
        expect(compileSelection(options).filter('mpox')?.render()).toContain('geoLocAdmin1');
        expect(compileSelection({ ...options, skip: 'country' }).filter('mpox')).toBeUndefined();
    });
});
