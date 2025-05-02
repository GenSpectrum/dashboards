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

    return [
        ...lineages,
        ...(variantFilter.mutations?.nucleotideMutations ?? []),
        ...(variantFilter.mutations?.aminoAcidMutations ?? []),
        ...(variantFilter.mutations?.nucleotideInsertions ?? []),
        ...(variantFilter.mutations?.aminoAcidInsertions ?? []),
    ].join(' + ');
}
