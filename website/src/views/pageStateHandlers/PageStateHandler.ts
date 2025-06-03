import { type VariantFilter } from '../View.ts';

export interface PageStateHandler<PageState extends object> {
    parsePageStateFromUrl(url: URL): PageState;

    toUrl(pageState: PageState): string;

    getDefaultPageUrl(): string;
}

export function toLapisFilterFromVariant(variantFilter: VariantFilter) {
    if (variantFilter.variantQuery) {
        return { variantQuery: variantFilter.variantQuery };
    } else {
        return {
            ...variantFilter.lineages,
            ...variantFilter.mutations,
            advancedQuery: variantFilter.advancedQuery,
        };
    }
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
