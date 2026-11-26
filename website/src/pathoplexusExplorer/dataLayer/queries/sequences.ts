import { compactly, sequences } from './builders.ts';
import { field, str, type Expr } from '../transport/expression.ts';
import { count } from '../transport/functions.ts';
import { table, type Relation } from '../transport/relation.ts';

export function referenceSequencesQuery(names: readonly string[]): Relation | undefined {
    if (names.length === 0) {
        return undefined;
    }
    return table('reference_genomes')
        .filter(field('name').isIn(names.map(str)))
        .project(['name', 'sequence']);
}

/** Group symbols at a position to count mutations and coverage from the same query. */
export function symbolCountsQuery(options: {
    table: string;
    filter: Expr | undefined;
    sequence: string;
    position: number;
    by?: readonly string[];
}): Relation {
    const by = options.by ?? [];
    return compactly(
        sequences(options.table)
            .filter(options.filter)
            .map({ symbol: field(options.sequence).at(options.position) })
            .group({ n: count() }, ['symbol', ...by]),
        // Use short aliases for grouped collection dates because a response can contain many distinct ranges.
        { rename: ['symbol', ...by], keep: ['n'] },
    );
}
