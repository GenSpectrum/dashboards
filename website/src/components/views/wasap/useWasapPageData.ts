import type { CustomColumn } from '@genspectrum/dashboard-components/util';
import { useQuery } from '@tanstack/react-query';

import { getCladeLineages } from '../../../lapis/getCladeLineages';
import { getMutations, getMutationsForVariant } from '../../../lapis/getMutations';
import { wastewaterConfig } from '../../../types/wastewaterConfig';
import type { WasapAnalysisFilter } from '../../../views/pageStateHandlers/WasapPageStateHandler';

type AllMutations = {
    type: 'all';
};

type SelectedMutations = {
    type: 'selected';
    mutations: string[];
};

type SelectedWithJaccard = {
    type: 'jaccard';
    mutationsWithScore: { mutation: string; jaccardIndex: number }[];
};

type MutationSelection = AllMutations | SelectedMutations | SelectedWithJaccard;

async function fetchMutationSelection(analysis: WasapAnalysisFilter): Promise<MutationSelection> {
    switch (analysis.mode) {
        case 'manual':
            return analysis.mutations ? { type: 'selected', mutations: analysis.mutations } : { type: 'all' };
        case 'variant':
            if (!analysis.variant) {
                return { type: 'selected', mutations: [] };
            }
            return getMutationsForVariant(
                wastewaterConfig.wasap.covSpectrum.lapisBaseUrl,
                analysis.sequenceType,
                analysis.variant,
                analysis.minProportion,
                analysis.minCount,
                analysis.minJaccard,
            ).then((r) => ({ type: 'jaccard', mutationsWithScore: r }));
        case 'resistance':
            return {
                type: 'selected',
                mutations:
                    wastewaterConfig.wasap.resistanceMutations.find(
                        (resistanceMutation) => resistanceMutation.name === analysis.resistanceSet,
                    )?.mutations ?? [],
            };
        case 'untracked': {
            const variantsToExclude =
                analysis.excludeSet === 'custom'
                    ? analysis.excludeVariants
                    : await getCladeLineages(
                          wastewaterConfig.wasap.covSpectrum.lapisBaseUrl,
                          wastewaterConfig.wasap.covSpectrum.cladeField,
                          wastewaterConfig.wasap.covSpectrum.lineageField,
                          true,
                      ).then((r) => Object.values(r));
            if (variantsToExclude === undefined) {
                return { type: 'selected', mutations: [] };
            }
            const [excludeMutations, allMuts] = await Promise.all([
                Promise.all(
                    variantsToExclude.map((v) =>
                        getMutations(wastewaterConfig.wasap.covSpectrum.lapisBaseUrl, analysis.sequenceType, v, 0.8, 9),
                    ),
                ).then((r) => r.flat()),
                getMutations(wastewaterConfig.wasap.lapisBaseUrl, analysis.sequenceType, undefined, 0.05, 5),
            ]);
            return {
                type: 'selected',
                mutations: allMuts.filter((m) => !excludeMutations.includes(m)),
            };
        }
    }
}

/**
 * The W-ASAP page data consists of the mutations to display in the mutations-over-time component,
 * and the additional custom columns that might optionally be displayed.
 *
 * If displayMutations is undefined, that means that all mutations should be displayed
 * (That is the default behaviour of the mutations-over-time component).
 */
type WasapPageData = {
    displayMutations?: string[];
    customColumns?: CustomColumn[];
};

/**
 * Turns the internal `MutationSelection` into the easier-to-work-with `WasapPageData`.
 */
function wasapPageDataFromMutationSelection(mutationSelection: MutationSelection | undefined): WasapPageData {
    if (mutationSelection === undefined) {
        return {};
    }

    switch (mutationSelection.type) {
        case 'all':
            return {};
        case 'selected':
            return { displayMutations: mutationSelection.mutations };
        case 'jaccard':
            return {
                displayMutations: mutationSelection.mutationsWithScore.map(({ mutation }) => mutation),
                customColumns: [
                    {
                        header: 'Jaccard index',
                        values: Object.fromEntries(
                            mutationSelection.mutationsWithScore.map(({ mutation, jaccardIndex }) => [
                                mutation,
                                jaccardIndex.toPrecision(2),
                            ]),
                        ),
                    },
                ],
            };
    }
}

/**
 * Hook that fetches and returns `WasapPageData` for the W-ASAP page,
 * depending on the analysis mode and analysis mode settings.
 */
export function useWasapPageData(analysis: WasapAnalysisFilter) {
    return useQuery({
        queryKey: ['wasap', analysis],
        queryFn: () => fetchMutationSelection(analysis).then((data) => wasapPageDataFromMutationSelection(data)),
    });
}
