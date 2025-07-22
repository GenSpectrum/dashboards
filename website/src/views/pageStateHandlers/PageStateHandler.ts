import { type DatasetAndVariantData, type VariantFilter } from '../View.ts';
import { toLapisFilterWithoutVariant } from './toLapisFilterWithoutVariant.ts';

export interface PageStateHandler<PageState extends object> {
    parsePageStateFromUrl(url: URL): PageState;

    toUrl(pageState: PageState): string;

    getDefaultPageUrl(): string;
}

type FilterData = DatasetAndVariantData & { additionalFilters: Record<string, string> | undefined };

export function toLapisFilterWithVariant({ variantFilter, datasetFilter, additionalFilters }: FilterData) {
    if (variantFilter.variantQuery) {
        return {
            ...toLapisFilterWithoutVariant(datasetFilter, additionalFilters),
            variantQuery: variantFilter.variantQuery,
        };
    } else {
        return {
            ...toLapisFilterWithoutVariant(datasetFilter, additionalFilters),
            ...variantFilter.lineages,
            ...variantFilter.mutations,
            advancedQuery: concatenateAdvancedQueries(datasetFilter.advancedQuery, variantFilter.advancedQuery),
        };
    }
}

function concatenateAdvancedQueries(
    datasetAdvancedQuery: string | undefined,
    variantAdvancedQuery: string | undefined,
) {
    if (datasetAdvancedQuery === undefined && variantAdvancedQuery === undefined) {
        return undefined;
    }
    if (datasetAdvancedQuery === undefined) {
        return variantAdvancedQuery;
    }
    if (variantAdvancedQuery === undefined) {
        return datasetAdvancedQuery;
    }
    return `(${datasetAdvancedQuery}) and (${variantAdvancedQuery})`;
}

export function toDisplayName(variantFilter: VariantFilter) {
    if (variantFilter.variantQuery) {
        return variantFilter.variantQuery;
    }

    const lineages = variantFilter.lineages
        ? Object.values(variantFilter.lineages).filter((lineage) => lineage !== undefined)
        : [];

    const advancedQuery: string[] = variantFilter.advancedQuery ? [variantFilter.advancedQuery] : [];

    return [
        ...lineages,
        ...(variantFilter.mutations?.nucleotideMutations ?? []),
        ...(variantFilter.mutations?.aminoAcidMutations ?? []),
        ...(variantFilter.mutations?.nucleotideInsertions ?? []),
        ...(variantFilter.mutations?.aminoAcidInsertions ?? []),
        ...advancedQuery,
    ].join(' + ');
}
