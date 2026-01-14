import type { CustomColumn, LapisFilter } from '@genspectrum/dashboard-components/util';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import type { VariantTimeFrame, WasapAnalysisFilter, WasapPageConfig } from './wasapPageConfig';
import { getCladeLineages } from '../../../lapis/getCladeLineages';
import { getMutations, getMutationsForVariant } from '../../../lapis/getMutations';

/**
 * Hook that fetches and returns `WasapPageData` for the W-ASAP page,
 * depending on the analysis mode and analysis mode settings.
 */
export function useWasapPageData(config: WasapPageConfig, analysis: WasapAnalysisFilter) {
    return useQuery({
        queryKey: ['wasap', analysis],
        queryFn: () =>
            fetchMutationSelection(config, analysis).then((data) => wasapPageDataFromMutationSelection(data)),
    });
}

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

async function fetchMutationSelection(
    config: WasapPageConfig,
    analysis: WasapAnalysisFilter,
): Promise<MutationSelection> {
    switch (analysis.mode) {
        case 'manual':
            if (!config.manualAnalysisModeEnabled) {
                throw Error("Cannot fetch data, 'manual' mode is not enabled.");
            }
            return analysis.mutations ? { type: 'selected', mutations: analysis.mutations } : { type: 'all' };
        case 'variant':
            if (!config.variantAnalysisModeEnabled) {
                throw Error("Cannot fetch data, 'variant' mode is not enabled.");
            }
            if (!analysis.variant) {
                return { type: 'selected', mutations: [] };
            }
            return getMutationsForVariant(
                config.clinicalLapis.lapisBaseUrl,
                analysis.sequenceType,
                {
                    [config.clinicalLapis.lineageField]: analysis.variant,
                },
                analysis.minProportion,
                analysis.minCount,
                analysis.minJaccard,
                getLapisFilterForTimeFrame(analysis.timeFrame, config.clinicalLapis.dateField),
            ).then((r) => ({ type: 'jaccard', mutationsWithScore: r }));
        case 'resistance':
            if (!config.resistanceAnalysisModeEnabled) {
                throw Error("Cannot fetch data, 'resistance' mode is not enabled.");
            }
            return {
                type: 'selected',
                mutations:
                    config.resistanceMutationSets.find((set) => set.name === analysis.resistanceSet)?.mutations ?? [],
            };
        case 'untracked': {
            if (!config.untrackedAnalysisModeEnabled) {
                throw Error("Cannot fetch data, 'untracked' mode is not enabled.");
            }
            const variantsToExclude =
                analysis.excludeSet === 'custom'
                    ? analysis.excludeVariants
                    : await getCladeLineages(
                          config.clinicalLapis.lapisBaseUrl,
                          config.clinicalLapis.cladeField,
                          config.clinicalLapis.lineageField,
                          true,
                      ).then((r) => Object.values(r));
            if (variantsToExclude === undefined) {
                return { type: 'selected', mutations: [] };
            }
            const [excludeMutations, allMuts] = await Promise.all([
                Promise.all(
                    variantsToExclude.map((variant) =>
                        getMutations(
                            config.clinicalLapis.lapisBaseUrl,
                            analysis.sequenceType,
                            {
                                [config.clinicalLapis.lineageField]: variant,
                            },
                            0.8,
                            9,
                        ),
                    ),
                ).then((r) => r.flat()),
                getMutations(config.lapisBaseUrl, analysis.sequenceType, undefined, 0.05, 5),
            ]);
            return {
                type: 'selected',
                mutations: allMuts.filter((m) => !excludeMutations.includes(m)),
            };
        }
    }
}

export function getLapisFilterForTimeFrame(timeFrame: VariantTimeFrame, dateFieldName: string): LapisFilter {
    let fromDate = undefined;
    switch (timeFrame) {
        case 'all':
            break;
        case '6months':
            fromDate = dayjs().subtract(6, 'month').format('YYYY-MM-DD');
            break;
        case '3months':
            fromDate = dayjs().subtract(3, 'month').format('YYYY-MM-DD');
            break;
    }
    if (fromDate === undefined) {
        return {};
    }
    return {
        [`${dateFieldName}From`]: fromDate,
    };
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
