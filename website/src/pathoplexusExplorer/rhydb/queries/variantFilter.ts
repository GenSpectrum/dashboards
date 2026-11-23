/** Compile resolved CoV-Spectrum variant expressions into RhyQL predicates. */

import { definitionRelationsOf } from './definitions.ts';
import type { Hierarchy } from '../../domain/lineages.ts';
import { MUTATION_KIND, type ResolvedNode } from '../../domain/variant.ts';
import {
    and,
    booleanLiteral,
    field,
    call,
    callWith,
    integerLiteral,
    not,
    or,
    set,
    textLiteral,
    type Expr,
} from '../transport/expression.ts';

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
            return call('maybe', [compile(node.child)]);
        case 'nOf':
            return callWith(
                'nOf',
                [integerLiteral(node.n), set(node.children.map(compile))],
                node.exactly ? { matchExactly: booleanLiteral(true) } : {},
            );
        case 'mutation': {
            const nucleotide = node.kind === MUTATION_KIND.nucleotide;
            const args = { position: integerLiteral(node.position), sequenceName: textLiteral(node.sequence) };
            if (node.to === undefined) {
                return call(nucleotide ? 'hasMutation' : 'hasAAMutation', args);
            }
            return call(nucleotide ? 'nucleotideEquals' : 'aminoAcidEquals', {
                position: args.position,
                symbol: textLiteral(node.to),
                sequenceName: args.sequenceName,
            });
        }
        case 'insertion': {
            const escaped = node.kind === MUTATION_KIND.aminoAcid ? node.value.replaceAll('*', '\\*') : node.value;
            return call(node.kind === MUTATION_KIND.nucleotide ? 'insertionContains' : 'aminoAcidInsertionContains', {
                position: integerLiteral(node.position),
                value: textLiteral(escaped.replaceAll('?', '.*')),
                sequenceName: textLiteral(node.sequence),
            });
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
        return target.eq(textLiteral(value));
    }
    return target.lineageFromTables({
        value: textLiteral(value),
        ...definitionRelationsOf(table, column),
        sublineages,
    });
}
