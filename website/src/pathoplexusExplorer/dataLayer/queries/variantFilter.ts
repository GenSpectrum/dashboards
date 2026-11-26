/** Compile resolved CoV-Spectrum variant expressions into RhyQL predicates. */

import { definitionRelationsOf } from './definitions.ts';
import type { Hierarchy } from '../../domain/lineages.ts';
import { MUTATION_KIND, type ResolvedNode } from '../../domain/variant.ts';
import { and, field, not, or, str, type Expr } from '../transport/expression.ts';
import {
    aminoAcidEquals,
    aminoAcidInsertionContains,
    hasAAMutation,
    hasMutation,
    insertionContains,
    maybe,
    nOf,
    nucleotideEquals,
} from '../transport/functions.ts';

export function compileVariant(node: ResolvedNode, tableName: string, hierarchy: Hierarchy): Expr {
    const compile = (child: ResolvedNode) => compileVariant(child, tableName, hierarchy);
    switch (node.type) {
        case 'and': {
            const [first, ...rest] = node.children.map(compile);
            return and(first, ...rest);
        }
        case 'or': {
            const [first, ...rest] = node.children.map(compile);
            return or(first, ...rest);
        }
        case 'not':
            return not(compile(node.child));
        case 'maybe':
            return maybe(compile(node.child));
        case 'nOf':
            return nOf(node.n, node.children.map(compile), node.exactly ? { matchExactly: true } : undefined);
        case 'mutation': {
            const nucleotide = node.kind === MUTATION_KIND.nucleotide;
            const at = { position: node.position, sequenceName: node.sequence };
            if (node.to === undefined) {
                return nucleotide ? hasMutation(at) : hasAAMutation(at);
            }
            const symbol = { ...at, symbol: node.to };
            return nucleotide ? nucleotideEquals(symbol) : aminoAcidEquals(symbol);
        }
        case 'insertion': {
            const escaped = node.kind === MUTATION_KIND.aminoAcid ? node.value.replaceAll('*', '\\*') : node.value;
            const insertion = {
                position: node.position,
                value: escaped.replaceAll('?', '.*'),
                sequenceName: node.sequence,
            };
            return node.kind === MUTATION_KIND.nucleotide
                ? insertionContains(insertion)
                : aminoAcidInsertionContains(insertion);
        }
        case 'lineage':
            return lineageFilter({
                table: tableName,
                column: node.column,
                value: node.value,
                sublineages: node.sublineages,
                hierarchy,
            });
    }
}

/** Use the RhyDB lineage hierarchy when one is available for the selected column. */
export function lineageFilter(options: {
    table: string;
    column: string;
    value: string;
    sublineages: boolean;
    hierarchy: Hierarchy;
}): Expr {
    const { table, column, value, sublineages, hierarchy } = options;
    const target = field(column);
    const tree = hierarchy(table, column);
    if (tree?.has(value) !== true) {
        return target.eq(str(value));
    }
    return target.lineageFromTables({
        value: str(value),
        ...definitionRelationsOf(table, column),
        sublineages,
    });
}
