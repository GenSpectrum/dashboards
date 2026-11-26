import { MUTATION_FIELDS, sequences } from './builders.ts';
import { MUTATION_KIND, type MutationKind } from '../../domain/variant.ts';
import type { Expr } from '../transport/expression.ts';
import type { Relation } from '../transport/relation.ts';

/** Use a fixed query floor below the cutoffs used in the reports. */
export const REPORT_FLOOR = 0.05;

export type MutationRequest = {
    kind: MutationKind;
    minProportion: number;
};

export function mutationProfileQuery(options: {
    tableName: string;
    filter: Expr | undefined;
    request: MutationRequest;
}): Relation {
    const relation = sequences(options.tableName).filter(options.filter);
    const args = { minProportion: options.request.minProportion, fields: MUTATION_FIELDS };
    return options.request.kind === MUTATION_KIND.aminoAcid
        ? relation.aminoAcidMutations(args)
        : relation.mutations(args);
}
