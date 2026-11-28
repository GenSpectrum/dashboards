import { expect, test } from 'vitest';

import { compileVariant } from './variantFilter.ts';
import { parseVariant, resolveVariant } from '../../domain/variant.ts';
import { HIERARCHY } from '../../test/hierarchy.fixture.ts';

const sequences = {
    nucleotide: [{ name: 'main', display: '' }],
    aminoAcid: [{ name: 'F', display: 'F' }],
};
const context = { sequences, columns: [{ column: 'lineage', hierarchical: true }] };
const compile = (text: string) => {
    const parsed = parseVariant(text);
    if (!parsed.ok) {
        throw new Error(`'${text}' could not be parsed`);
    }
    const resolved = resolveVariant(parsed.node, context);
    if (!resolved.ok) {
        throw new Error(resolved.error);
    }
    return compileVariant(resolved.node, 'rsv_a', HIERARCHY).render();
};

test('a named symbol, a bare position and a deletion', () => {
    expect(compile('F:K68N')).toBe("aminoAcidEquals(position := 68, symbol := 'N', sequenceName := 'F')");
    expect(compile('F:68')).toBe("hasAAMutation(position := 68, sequenceName := 'F')");
    expect(compile('C466T')).toBe("nucleotideEquals(position := 466, symbol := 'T', sequenceName := 'main')");
    expect(compile('466')).toBe("hasMutation(position := 466, sequenceName := 'main')");
    expect(compile('466-')).toBe("nucleotideEquals(position := 466, symbol := '-', sequenceName := 'main')");
});

test('the operators of the language', () => {
    expect(compile('F:K68N & !C466T')).toBe(
        "aminoAcidEquals(position := 68, symbol := 'N', sequenceName := 'F') && " +
            "!nucleotideEquals(position := 466, symbol := 'T', sequenceName := 'main')",
    );
    expect(compile('F:68 | F:69')).toBe(
        "hasAAMutation(position := 68, sequenceName := 'F') || hasAAMutation(position := 69, sequenceName := 'F')",
    );
});

test('an insertion, whose ? stands for any symbols', () => {
    expect(compile('ins_F:214:E?PE')).toBe(
        "aminoAcidInsertionContains(position := 214, value := 'E.*PE', sequenceName := 'F')",
    );
});

test('a lineage, with the lineages below it when it ends in a star', () => {
    expect(compile('lineage:A.D')).toBe("lineage.lineageFromTables('A.D', rsv_a_lineage, rsv_a_lineage_aliases)");
    expect(compile('lineage:A.D*')).toBe(
        "lineage.lineageFromTables('A.D', rsv_a_lineage, rsv_a_lineage_aliases, includeSublineages := true)",
    );
    expect(compile('lineage:A.9.9*')).toBe("lineage = 'A.9.9'");
});
