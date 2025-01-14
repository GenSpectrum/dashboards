import type { LineageFilterConfig } from './LineageFilterInput.tsx';
import type { VariantFilter } from '../../views/View.ts';
import type { LapisMutationQuery } from '../../views/helpers.ts';

export type VariantFilterConfig = {
    variantQueryConfig?: string;
    lineageFilterConfigs?: LineageFilterConfig[];
    mutationFilterConfig?: LapisMutationQuery;
    isInVariantQueryMode?: boolean;
};

export function toVariantFilter(variantFilterConfig: VariantFilterConfig): VariantFilter {
    if (variantFilterConfig.isInVariantQueryMode) {
        return {
            variantQuery: variantFilterConfig.variantQueryConfig,
        };
    } else {
        return {
            mutations: variantFilterConfig.mutationFilterConfig,
            lineages: variantFilterConfig.lineageFilterConfigs?.reduce((acc, lineageFilterConfig) => {
                return { ...acc, [lineageFilterConfig.lapisField]: lineageFilterConfig.initialValue };
            }, {}),
        };
    }
}
