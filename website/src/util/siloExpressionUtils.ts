import type { SiloFilterExpression } from '../lapis/siloFilterExpression.ts';

/**
 * Result of validating a SILO filter expression
 */
export interface GenomeCheckResult {
    /** Whether the expression tree contains only genome checks */
    isGenomeOnly: boolean;
    /** Error message if validation failed */
    error?: string;
}

/**
 * Set of expression types that are considered genome checks
 */
const GENOME_CHECK_TYPES = new Set([
    'NucleotideEquals',
    'HasNucleotideMutation',
    'AminoAcidEquals',
    'HasAminoAcidMutation',
    'InsertionContains',
    'AminoAcidInsertionContains',
]);

/**
 * Traverses a SILO filter expression tree and validates that only genome checks are used.
 *
 * @param expression The SILO filter expression to traverse
 * @returns Result containing validation status
 */
export function validateGenomeOnly(expression: SiloFilterExpression): GenomeCheckResult {
    const nonGenomeTypes: string[] = [];

    function traverse(expr: SiloFilterExpression): void {
        const { type } = expr;

        // Recursion
        if (type === 'And' || type === 'Or' || type === 'N-Of') {
            expr.children.forEach(traverse);
            return;
        }
        if (type === 'Not' || type === 'Maybe') {
            traverse(expr.child);
            return;
        }

        if (type === 'True' || GENOME_CHECK_TYPES.has(type)) {
            return; // allowed query component, do nothing
        }

        // If we reach here, it's not a genome check or logical operator
        nonGenomeTypes.push(type);
    }

    traverse(expression);

    if (nonGenomeTypes.length > 0) {
        return {
            isGenomeOnly: false,
            error: `Expression contains non-genome check types: ${nonGenomeTypes.join(', ')}`,
        };
    }

    return {
        isGenomeOnly: true,
    };
}
