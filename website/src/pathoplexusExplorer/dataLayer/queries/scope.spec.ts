import { describe, expect, test } from 'vitest';

import { scopeFilter, type ScopeLookups } from './scope.ts';
import { CATALOG } from '../../domain/catalog.ts';
import { todayUtc } from '../../domain/dates.ts';
import { WORLD } from '../../domain/geography.ts';
import type { Scope } from '../../domain/scope.ts';
import { ALL, parseSubject, type Subject } from '../../domain/subject.ts';
import { defined } from '../../test/defined.fixture.ts';
import { HIERARCHY } from '../../test/hierarchy.fixture.ts';

const nodeOf = (key: string): Subject => defined(parseSubject(key, CATALOG), `'${key}' in the catalog`);

const lookups: ScopeLookups = {
    hierarchy: HIERARCHY,
    columnValues: (table, column) =>
        table === 'rsv_a' && column === 'lineage' ? ['A.D', 'A.D.1', 'A.D.5.2', 'A.3', 'None', null] : undefined,
};

function scope(partial: Partial<Scope>): Scope {
    return { what: ALL, where: WORLD, period: {}, ...partial };
}

describe('the scope filter', () => {
    test('all pathogens everywhere at any time keep every row', () => {
        expect(scopeFilter(scope({}), lookups)('dengue')).toBeUndefined();
    });

    test('a province gathers every spelling recorded for it', () => {
        const filter = scopeFilter(scope({ where: { level: 'admin1', country: 'USA', admin1: 'Illinois' } }), {
            ...lookups,
            admin1Names: ['Illinois', 'Illinois, Cook County', 'IL', 'Cook, Illinois', 'Texas', null],
        });
        expect(filter('west_nile')?.render()).toBe(
            "geoLocCountry = 'USA' && geoLocAdmin1.in({'Illinois', 'Illinois, Cook County', 'IL', 'Cook, Illinois'})",
        );
    });

    test('a province whose spellings are not known is matched by name', () => {
        const filter = scopeFilter(scope({ where: { level: 'admin1', country: 'USA', admin1: 'Illinois' } }), lookups);
        expect(filter('west_nile')?.render()).toBe("geoLocCountry = 'USA' && geoLocAdmin1 = 'Illinois'");
    });

    test('an end date alone still asks for a collection date, which an undated entry has not got', () => {
        const filter = scopeFilter(scope({ period: { to: '2024-12-31' } }), lookups);
        expect(filter('dengue')?.render()).toBe(
            "isNotNull(sampleCollectionDateRangeLower) && sampleCollectionDateRangeUpper <= '2024-12-31'::date",
        );
    });

    test('a start date alone ends on the date printed on the report', () => {
        const filter = scopeFilter(scope({ period: { from: '2024-01-01' } }), lookups);
        expect(filter('dengue')?.render()).toContain(`sampleCollectionDateRangeUpper <= '${todayUtc()}'::date`);
    });

    test('place and time, with the country spelled as the data spells it', () => {
        const filter = scopeFilter(
            scope({
                where: { level: 'country', country: "Cote d'Ivoire" },
                period: { from: '2020-01-01', to: '2020-12-31' },
            }),
            lookups,
        );
        expect(filter('dengue')?.render()).toBe(
            "geoLocCountry = 'Cote d''Ivoire' && sampleCollectionDateRangeLower >= '2020-01-01'::date && sampleCollectionDateRangeUpper <= '2020-12-31'::date",
        );
    });

    test("a lineage is resolved against the instance's definition, and only on its own table", () => {
        const filter = scopeFilter(scope({ what: nodeOf('pathogen:rsv_a/lineage=A.D') }), lookups);
        expect(filter('rsv_a')?.render()).toBe(
            "isNotNull(lineage) && lineage.lineageFromTables('A.D', rsv_a_lineage, rsv_a_lineage_aliases, includeSublineages := true)",
        );
        expect(filter('rsv_b')).toBeUndefined();
    });

    test('a lineage left out of a scope is taken off the lineage above it', () => {
        const filter = scopeFilter(
            scope({ what: nodeOf('pathogen:rsv_a/lineage=A.3'), except: nodeOf('pathogen:rsv_a/lineage=A.D') }),
            lookups,
        );
        expect(filter('rsv_a')?.render()).toBe(
            "isNotNull(lineage) && lineage.lineageFromTables('A.3', rsv_a_lineage, rsv_a_lineage_aliases, includeSublineages := true) && " +
                "!(isNotNull(lineage) && lineage.lineageFromTables('A.D', rsv_a_lineage, rsv_a_lineage_aliases, includeSublineages := true))",
        );
    });

    test('what is left out is left out of its own table alone', () => {
        const filter = scopeFilter(scope({ what: ALL, except: nodeOf('pathogen:rsv_a/lineage=A.D') }), lookups);
        expect(filter('rsv_b')).toBeUndefined();
    });

    test('the unassigned can be left out, under every spelling that the column holds', () => {
        const filter = scopeFilter(
            scope({ what: nodeOf('pathogen:rsv_a'), except: nodeOf('pathogen:rsv_a/lineage=(unassigned)') }),
            lookups,
        );
        expect(filter('rsv_a')?.render()).toBe("!(isNull(lineage) || lineage.in({'None'}))");
    });

    test('a column the instance defines no hierarchy for selects the value alone', () => {
        const filter = scopeFilter(scope({ what: nodeOf('pathogen:measles/genotype=D8') }), lookups);
        expect(filter('measles')?.render()).toBe("isNotNull(genotype) && genotype = 'D8'");
    });

    test('a value the definition does not hold is selected on its own rather than by the definition', () => {
        const filter = scopeFilter(scope({ what: nodeOf('pathogen:rsv_a/lineage=A.9.9') }), lookups);
        expect(filter('rsv_a')?.render()).toBe("isNotNull(lineage) && lineage = 'A.9.9'");
    });

    test('unassigned covers missing values and their spellings', () => {
        const filter = scopeFilter(scope({ what: nodeOf('pathogen:rsv_a/lineage=(unassigned)') }), lookups);
        expect(filter('rsv_a')?.render()).toBe("isNull(lineage) || lineage.in({'None'})");
    });

    test('a regional report includes the recorded country aliases shown in its breakdown', () => {
        const filter = scopeFilter(scope({ where: { level: 'subregion', subregion: 'Southern Asia' } }), lookups);
        expect(filter('dengue')?.render()).toContain("'New Delhi'");
    });

    test('a continent is the list of its countries', () => {
        const rendered = scopeFilter(
            scope({ where: { level: 'continent', continent: 'Oceania' } }),
            lookups,
        )('dengue')?.render();
        expect(rendered).toContain("geoLocCountry.in({'Australia', 'New Zealand', 'Fiji'");
    });
});
