import { describe, expect, it } from 'vitest';

import { subjectOptions, subjectValue, withAbove, withLevel } from './subjectOptions.ts';
import { defined } from '../../../pathoplexusExplorer/defined.fixture.ts';
import { CATALOG } from '../../../pathoplexusExplorer/domain/catalog.ts';
import { isPathogenNode, parseSubject, subjectKey } from '../../../pathoplexusExplorer/domain/subject.ts';

const parsed = parseSubject('pathogen:dengue', CATALOG);
const dengue = defined(isPathogenNode(parsed) ? parsed : undefined, 'dengue in the catalog');

describe('withLevel', () => {
    it('sets a level', () => {
        expect(subjectKey(withLevel(dengue, 'serotype', 'DENV-1'))).toBe('pathogen:dengue/serotype=DENV-1');
    });

    it('drops the levels below the one set, which belong to another branch', () => {
        const lineage = withLevel(withLevel(dengue, 'serotype', 'DENV-1'), 'lineage', '1III_A');
        expect(subjectKey(withLevel(lineage, 'serotype', 'DENV-2'))).toBe('pathogen:dengue/serotype=DENV-2');
    });

    it('names the level that a value belongs to as well, in the order that the levels are declared in', () => {
        const node = withLevel(dengue, 'lineage', '1III_A', { column: 'serotype', value: 'DENV-1' });
        expect(subjectKey(node)).toBe('pathogen:dengue/serotype=DENV-1/lineage=1III_A');
    });

    it('keeps a level already chosen over the one that a value names', () => {
        const chosen = withLevel(dengue, 'serotype', 'DENV-2');
        const node = withLevel(chosen, 'lineage', '1III_A', { column: 'serotype', value: 'DENV-1' });
        expect(subjectKey(node)).toBe('pathogen:dengue/serotype=DENV-2/lineage=1III_A');
    });
});

describe('withAbove', () => {
    it('adds the level above and leaves the choices below it standing', () => {
        const lineage = withLevel(dengue, 'lineage', '1III_A');
        expect(subjectKey(withAbove(lineage, { column: 'serotype', value: 'DENV-1' }))).toBe(
            'pathogen:dengue/serotype=DENV-1/lineage=1III_A',
        );
    });

    it('changes nothing where the level is already named', () => {
        const node = withLevel(withLevel(dengue, 'serotype', 'DENV-1'), 'lineage', '1III_A');
        expect(withAbove(node, { column: 'serotype', value: 'DENV-2' })).toBe(node);
    });
});

describe('subjectOptions', () => {
    it('offers a group and a family above the pathogens they hold, indented', () => {
        const options = subjectOptions();
        const ebola = defined(
            options.find((option) => option.value === 'family:ebola'),
            'the Ebola family among the options',
        );
        const zaire = defined(
            options.find((option) => option.value === 'pathogen:ebola_zaire'),
            'Ebola Zaire among the options',
        );
        expect(ebola.group).toBe(zaire.group);
        expect(zaire.depth).toBe((ebola.depth ?? 0) + 1);
        expect(options.some((option) => option.value.startsWith('group:'))).toBe(true);
    });

    it('offers the pathogens alone where a subject has to be one of them', () => {
        const options = subjectOptions({ wholeGroups: false });
        expect(options.every((option) => option.value.startsWith('pathogen:'))).toBe(true);
        expect(options.some((option) => option.value === 'pathogen:ebola_zaire')).toBe(true);
    });

    it('shows a lineage as its pathogen, the level below naming the lineage', () => {
        const serotype = withLevel(dengue, 'serotype', 'DENV-1');
        expect(subjectValue(serotype)).toBe('pathogen:dengue');
    });

    it('offers the subtypes that stand as pathogens under the pathogen they are of', () => {
        const options = subjectOptions({ subtypes: true });
        const pathogen = defined(
            options.find((option) => option.value === 'pathogen:dengue'),
            'dengue among the options',
        );
        const serotype = defined(
            options.find((option) => option.value === 'pathogen:dengue/serotype=DENV-2'),
            'DENV-2 among the options',
        );
        expect(serotype.label).toBe('DENV-2');
        expect(serotype.group).toBe(pathogen.group);
        expect(serotype.depth).toBe((pathogen.depth ?? 0) + 1);
        expect(options.some((option) => option.value.includes('lineage='))).toBe(false);
    });

    it('shows one of them as itself, and a lineage of it as the subtype it lies in', () => {
        const serotype = withLevel(dengue, 'serotype', 'DENV-2');
        expect(subjectValue(serotype, { subtypes: true })).toBe('pathogen:dengue/serotype=DENV-2');
        const lineage = withLevel(serotype, 'lineage', '2II');
        expect(subjectValue(lineage, { subtypes: true })).toBe('pathogen:dengue');
    });
});
