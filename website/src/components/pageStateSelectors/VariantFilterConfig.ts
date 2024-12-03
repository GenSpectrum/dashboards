import type { LineageFilterConfig } from './LineageFilterInput.tsx';
import type { VariantFilter } from '../../views/View.ts';
import type { LapisMutationQuery } from '../../views/helpers.ts';

export type VariantFilterConfig = {
    lineageFilterConfigs: LineageFilterConfig[];
    mutationFilterConfig: LapisMutationQuery;
};

export function toVariantFilter(variantFilterConfig: VariantFilterConfig): VariantFilter {
    return {
        mutations: variantFilterConfig.mutationFilterConfig,
        lineages: variantFilterConfig.lineageFilterConfigs.reduce((acc, lineageFilterConfig) => {
            return { ...acc, [lineageFilterConfig.lapisField]: lineageFilterConfig.initialValue };
        }, {}),
    };
}