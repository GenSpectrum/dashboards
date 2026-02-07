import type { CustomColumn, LapisFilter } from '@genspectrum/dashboard-components/util';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import type {
    VariantTimeFrame,
    WasapAnalysisFilter,
    WasapCollectionFilter,
    WasapManualFilter,
    WasapPageConfig,
    WasapResistanceFilter,
    WasapUntrackedFilter,
    WasapVariantFilter,
} from './wasapPageConfig';
import { getCollection } from '../../../covspectrum/getCollection';
import { getCladeLineages } from '../../../lapis/getCladeLineages';
import { getMutations, getMutationsForVariant } from '../../../lapis/getMutations';

/**
 * Hook that fetches and returns `WasapPageData` for the W-ASAP page,
 * depending on the analysis mode and analysis mode settings.
 */
export function useWasapPageData(config: WasapPageConfig, analysis: WasapAnalysisFilter) {
    return useQuery({
        queryKey: ['wasap', analysis],
        queryFn: () => fetchWasapPageData(config, analysis),
    });
}

async function fetchWasapPageData(config: WasapPageConfig, analysis: WasapAnalysisFilter): Promise<WasapPageData> {
    switch (analysis.mode) {
        case 'manual':
            return fetchManualModeData(config, analysis);
        case 'variant':
            return fetchVariantModeData(config, analysis);
        case 'resistance':
            return fetchResistanceModeData(config, analysis);
        case 'untracked':
            return fetchUntrackedModeData(config, analysis);
        case 'collection':
            return fetchCollectionModeData(config, analysis);
    }
}

function fetchManualModeData(config: WasapPageConfig, analysis: WasapManualFilter): WasapMutationsData {
    if (!config.manualAnalysisModeEnabled) {
        throw Error("Cannot fetch data, 'manual' mode is not enabled.");
    }
    return {
        type: 'mutations',
        displayMutations: analysis.mutations,
    };
}

async function fetchVariantModeData(
    config: WasapPageConfig,
    analysis: WasapVariantFilter,
): Promise<WasapMutationsData> {
    if (!config.variantAnalysisModeEnabled) {
        throw Error("Cannot fetch data, 'variant' mode is not enabled.");
    }
    const mutationsWithScore = await getMutationsForVariant(
        config.clinicalLapis.lapisBaseUrl,
        analysis.sequenceType,
        {
            [config.clinicalLapis.lineageField]: analysis.variant,
        },
        analysis.minProportion,
        analysis.minCount,
        analysis.minJaccard,
        getLapisFilterForTimeFrame(analysis.timeFrame, config.clinicalLapis.dateField),
    );
    return {
        type: 'mutations',
        displayMutations: mutationsWithScore.map(({ mutation }) => mutation),
        customColumns: [
            {
                header: 'Jaccard index',
                values: Object.fromEntries(
                    mutationsWithScore.map(({ mutation, jaccardIndex }) => [mutation, jaccardIndex.toPrecision(2)]),
                ),
            },
        ],
    };
}

function fetchResistanceModeData(config: WasapPageConfig, analysis: WasapResistanceFilter): WasapMutationsData {
    if (!config.resistanceAnalysisModeEnabled) {
        throw Error("Cannot fetch data, 'resistance' mode is not enabled.");
    }
    return {
        type: 'mutations',
        displayMutations:
            config.resistanceMutationSets.find((set) => set.name === analysis.resistanceSet)?.mutations ?? [],
    };
}

async function fetchUntrackedModeData(
    config: WasapPageConfig,
    analysis: WasapUntrackedFilter,
): Promise<WasapMutationsData> {
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
        return { type: 'mutations', displayMutations: [] };
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
        type: 'mutations',
        displayMutations: allMuts.filter((m) => !excludeMutations.includes(m)),
    };
}

async function fetchCollectionModeData(
    config: WasapPageConfig,
    analysis: WasapCollectionFilter,
): Promise<WasapCollectionData> {
    if (!config.collectionAnalysisModeEnabled) {
        throw Error("Cannot fetch data, 'collection' mode is not enabled.");
    }
    if (!analysis.collectionId) {
        throw Error('No collection selected');
    }
    const collection = await getCollection(config.collectionsApiBaseUrl, analysis.collectionId);
    const queries: {
        displayLabel: string;
        countQuery: string;
        coverageQuery: string;
    }[] = [];

    collection.variants.forEach((f) => {
        if (f.query.type === 'variantQuery') {
            // TODO - this way of generating a coverageQuery sort-of works, but is not production ready
            // we need to to it with the LAPIS endpoint: https://github.com/GenSpectrum/dashboards/issues/1026
            const positions = (f.query.variantQuery.match(/\d+/g) ?? []).map(Number);
            const coverageQuery = positions.map((p) => `!C${p}N`).join(' | ');
            queries.push({
                displayLabel: f.name,
                countQuery: f.query.variantQuery,
                coverageQuery,
            });
        }
    });
    return {
        type: 'collection',
        collection: {
            id: collection.id,
            title: collection.title,
            queries,
        },
    };
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
 * The W-ASAP page data can be either mutations data or collection data.
 */
export type WasapPageData = WasapMutationsData | WasapCollectionData;

/**
 * Mutations data consists of the mutations to display in the mutations-over-time component,
 * and the additional custom columns that might optionally be displayed.
 *
 * If displayMutations is undefined, that means that all mutations should be displayed
 * (That is the default behaviour of the mutations-over-time component).
 */
export type WasapMutationsData = {
    type: 'mutations';
    displayMutations?: string[];
    customColumns?: CustomColumn[];
};

/**
 * Collection data consists of a collection with its variants.
 */
export type WasapCollectionData = {
    type: 'collection';
    collection: {
        id: number;
        title: string;
        queries: {
            displayLabel: string;
            countQuery: string;
            coverageQuery: string;
        }[];
    };
};
