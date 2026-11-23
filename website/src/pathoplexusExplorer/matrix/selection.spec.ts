import { describe, expect, test } from 'vitest';

import { dimensionById, dimensionsFor, NOTHING, type ValuesLookup } from './dimensions.ts';
import {
    withDimensionCleared,
    compileSelection,
    constrainedCount,
    formatConstraints,
    withDimensionInverted,
    parseConstraints,
    PERIOD,
    tablesInScope,
    withValueToggled,
    withoutStrandedChoices,
    type Constraints,
} from './selection.ts';
import { CATALOG } from '../domain/catalog.ts';
import { allPathogens } from '../domain/subject.ts';

const TABLES = allPathogens(CATALOG).map((pathogen) => pathogen.table);
const DIMENSIONS = dimensionsFor({ catalog: CATALOG, tables: TABLES });
const LOOKUP: ValuesLookup = {
    countries: ['Brazil', 'Zaire', 'unknown', null],
    hosts: [{ name: 'Homo sapiens', taxon: '9606' }],
    subtypes: {},
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

describe('an address holding a selection', () => {
    test('is read back as it was written', () => {
        const selection: Constraints = {
            country: { values: ['Brazil', 'Viet Nam'] },
            host: { values: ['human'], exclude: true },
        };
        expect(parseConstraints(formatConstraints(selection))).toEqual(selection);
    });

    test('writes a value nothing was recorded for as a word rather than as a control character', () => {
        const written = formatConstraints({ country: { values: [NOTHING] } });
        expect(written).toBe('country=(none)');
        expect(parseConstraints(written)).toEqual({ country: { values: [NOTHING] } });
    });

    test('keeps a value that holds the characters that an address is punctuated with', () => {
        const selection: Constraints = { country: { values: ['a;b', 'c,d=e'] } };
        expect(parseConstraints(formatConstraints(selection))).toEqual(selection);
    });

    test('ignores what it cannot read, rather than taking the page down with it', () => {
        expect(parseConstraints('nonsense;=;country=')).toEqual({});
        expect(parseConstraints(null)).toEqual({});
    });
});

describe('choosing values', () => {
    test('adds one, and lets it go again', () => {
        const chosen = withValueToggled({}, 'country', 'Brazil');
        expect(chosen).toEqual({ country: { values: ['Brazil'] } });
        expect(withValueToggled(chosen, 'country', 'Brazil')).toEqual({});
    });

    test('keeps the values of a dimension as alternatives', () => {
        const chosen = withValueToggled(withValueToggled({}, 'country', 'Brazil'), 'country', 'India');
        expect(chosen.country?.values).toEqual(['Brazil', 'India']);
        expect(constrainedCount(chosen)).toBe(1);
    });

    test('inverts a dimension, and lets it go', () => {
        const chosen = withValueToggled({}, 'host', 'human');
        expect(chosen.host?.exclude).toBe(undefined);
        expect(withDimensionInverted(chosen, 'host').host?.exclude).toBe(true);
        expect(withDimensionInverted(withDimensionInverted(chosen, 'host'), 'host').host?.exclude).toBe(false);
    });

    test('clears one dimension and leaves the others', () => {
        const chosen = withValueToggled(withValueToggled({}, 'country', 'Brazil'), 'host', 'human');
        expect(withDimensionCleared(chosen, 'country')).toEqual({ host: { values: ['human'] } });
    });
});

describe('a selection compiled to a query', () => {
    test('keeps every table and filters nothing where nothing is chosen', () => {
        const compiled = compile({});
        expect(compiled.tables).toEqual(TABLES);
        expect(compiled.filter('mpox')).toBeUndefined();
    });

    test('narrows to the tables of the pathogens chosen', () => {
        expect(compile({ pathogen: { values: ['mpox'] } }).tables).toEqual(['mpox']);
    });

    test('leaves out the tables of the pathogens excluded', () => {
        const compiled = compile({ pathogen: { values: ['mpox'], exclude: true } });
        expect(compiled.tables).not.toContain('mpox');
        expect(compiled.tables.length).toBe(TABLES.length - 1);
    });

    test('gathers a country under every name it is recorded under', () => {
        const filter = compile({ country: { values: ['Democratic Republic of the Congo'] } }).filter('mpox');
        expect(filter?.render()).toContain('Zaire');
    });

    // RhyDB negation keeps null rows when they do not match the excluded value.
    test('excludes the selected values when a dimension is inverted', () => {
        const filter = compile({ country: { values: ['Brazil'], exclude: true } }).filter('mpox');
        expect(filter?.render()).toBe("!geoLocCountry = 'Brazil'");
    });

    test('names the spellings that record no country at all', () => {
        const filter = compile({ country: { values: [NOTHING] } }).filter('mpox');
        expect(filter?.render()).toBe("isNull(geoLocCountry) || geoLocCountry = 'unknown'");
    });

    test('leaves out the dimension that a filter counts, and only that one', () => {
        const chosen = { country: { values: ['Brazil'] }, host: { values: ['human'] } };
        expect(compile(chosen, 'country').filter('mpox')?.render()).not.toContain('Brazil');
        expect(compile(chosen, 'country').filter('mpox')?.render()).toContain('hostNameScientific');
    });

    test('leaves the subtype levels out with the pathogen they belong to', () => {
        const dimensions = dimensionsFor({ catalog: CATALOG, tables: ['mpox'] });
        const clade = dimensionById(dimensions, 'level:clade');
        expect(clade).toBeDefined();
        const chosen = withValueToggled(withValueToggled({}, 'pathogen', 'mpox'), 'level:clade', 'Ib');
        const compiled = compileSelection({
            selection: { dimensions: chosen, period: {} },
            dimensions,
            tables: TABLES,
            lookup: LOOKUP,
            skip: 'pathogen',
        });
        expect(compiled.tables).toEqual(TABLES);
        expect(compiled.filter('mpox')).toBeUndefined();
    });

    test('leaves the province out with the country that it lies in', () => {
        const dimensions = dimensionsFor({ catalog: CATALOG, tables: TABLES, country: 'USA' });
        const chosen = { country: { values: ['USA'] }, admin1: { values: ['Illinois'] } };
        const options = {
            selection: { dimensions: chosen, period: {} },
            dimensions,
            tables: TABLES,
            lookup: { ...LOOKUP, admin1Names: ['Illinois'] },
        };
        expect(compileSelection(options).filter('mpox')?.render()).toContain('geoLocAdmin1');
        expect(compileSelection({ ...options, skip: 'country' }).filter('mpox')).toBeUndefined();
    });

    test('asks for a collection period, and leaves it out for the timeline', () => {
        const selection = { dimensions: {}, period: { from: '2024-01-01', to: '2024-12-31' } };
        const options = { selection, dimensions: DIMENSIONS, tables: TABLES, lookup: LOOKUP };
        expect(compileSelection(options).filter('mpox')?.render()).toBe(
            "sampleCollectionDateRangeLower >= '2024-01-01'::date && sampleCollectionDateRangeUpper <= '2024-12-31'::date",
        );
        expect(compileSelection({ ...options, skip: PERIOD }).filter('mpox')).toBeUndefined();
    });
});

test('an address with a broken escape is taken as far as it goes, rather than failing the page', () => {
    expect(parseConstraints('country=%ZZ')).toEqual({ country: { values: ['%ZZ'] } });
});

test('a value named like a built-in property is a value, not a change to the object itself', () => {
    const constraints = parseConstraints('__proto__=brazil');

    expect(Object.keys(constraints)).toEqual(['__proto__']);
    expect(constraints.__proto__).toEqual({ values: ['brazil'] });
    expect(Object.getPrototypeOf({})).toEqual({});
});

describe('a submitting group in an address that is not a group ID', () => {
    const dimensions = parseConstraints('group=abc;country=Brazil');

    test('is left out of the query', () => {
        expect(compile(dimensions).filter('mpox')?.render()).toBe(
            compile({ country: { values: ['Brazil'] } })
                .filter('mpox')
                ?.render(),
        );
    });

    test('is removed from the address', () => {
        expect(withoutStrandedChoices(dimensions, DIMENSIONS)).toEqual({ country: { values: ['Brazil'] } });
        expect(withoutStrandedChoices(parseConstraints('group=12'), DIMENSIONS)).toBeUndefined();
    });
});

test('no value in an address can break the query that a selection compiles to', () => {
    const garbage = ['abc', '', '-1', '1e3', '\u0000x', "it's", '(none)'];
    for (const dimension of DIMENSIONS) {
        const dimensions = parseConstraints(`${dimension.id}=${garbage.map(encodeURIComponent).join(',')}`);
        expect(() => compile(dimensions).filter('mpox')?.render()).not.toThrow();
        expect(() => compile({ [dimension.id]: { values: garbage, exclude: true } }).filter('mpox')).not.toThrow();
    }
});

test('a collection year in an address must be a year, and the missing year is kept', () => {
    expect(withoutStrandedChoices(parseConstraints('year=abc,2024,(none)'), DIMENSIONS)).toEqual({
        year: { values: ['2024', NOTHING] },
    });
});

test('the pathogen and the pathogen group filters choose the tables together', () => {
    const constraints = parseConstraints('pathogen=rsv_a;pathogenGroup=!rsv');
    expect(tablesInScope({ constraints, dimensions: DIMENSIONS, tables: TABLES })).toEqual([]);
    expect(compile(constraints).tables).toEqual([]);
    expect(
        tablesInScope({ constraints: parseConstraints('pathogenGroup=rsv'), dimensions: DIMENSIONS, tables: TABLES }),
    ).toEqual(['rsv_a', 'rsv_b']);
});

test('leaves the subtype levels out with the pathogen group that kept their pathogen', () => {
    const dimensions = dimensionsFor({ catalog: CATALOG, tables: ['rsv_a'] });
    const chosen = parseConstraints('pathogen=rsv_a,ebola_sudan;pathogenGroup=rsv;level%3Alineage=A.D');
    const options = { selection: { dimensions: chosen, period: {} }, dimensions, tables: TABLES, lookup: LOOKUP };
    const forGroups = compileSelection({ ...options, skip: 'pathogenGroup' });
    expect(forGroups.tables).toEqual(['rsv_a', 'ebola_sudan']);
    expect(forGroups.filter('ebola_sudan')).toBeUndefined();
    expect(compileSelection(options).filter('rsv_a')?.render()).toContain('lineage');
});
