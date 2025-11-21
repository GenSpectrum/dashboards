import type { CustomColumn, MeanProportionInterval } from '@genspectrum/dashboard-components/util';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { type FC } from 'react';

import { RESISTANCE_MUTATIONS, resistanceMutationAnnotations } from './resistanceMutations';
import { getCladeLineages } from '../../../lapis/getCladeLineages';
import { getDateRange } from '../../../lapis/getDateRange';
import { getMutations, getMutationsForVariant } from '../../../lapis/getMutations';
import { getTotalCount } from '../../../lapis/getTotalCount';
import { wastewaterConfig } from '../../../types/wastewaterConfig';
import { Loading } from '../../../util/Loading';
import {
    WasapPageStateHandler,
    type WasapAnalysisFilter,
} from '../../../views/pageStateHandlers/WasapPageStateHandler';
import { GsMutationsOverTime } from '../../genspectrum/GsMutationsOverTime';
import { WasapPageStateSelector } from '../../pageStateSelectors/wasap/WasapPageStateSelector';
import { withQueryProvider } from '../../subscriptions/backendApi/withQueryProvider';

export type WasapPageProps = {
    currentUrl: URL;
};

export const WasapPageInner: FC<WasapPageProps> = ({ currentUrl }) => {
    // initialize page state from the URL
    const pageStateHandler = useMemo(() => new WasapPageStateHandler(), []);
    const { base, analysis } = useMemo(
        () => pageStateHandler.parsePageStateFromUrl(currentUrl),
        [pageStateHandler, currentUrl],
    );

    // fetch which mutations should be analyzed
    const {
        data: mutationSelection,
        isPending,
        isError,
    } = useQuery({
        queryKey: [base, analysis],
        queryFn: () => fetchMutationSelection(analysis),
    });

    const [displayMutations, customColumns] = getDisplayMutationsAndCustomColumns(mutationSelection);

    let initialMeanProportionInterval: MeanProportionInterval = { min: 0.0, max: 1.0 };
    if (analysis.mode === 'manual' && analysis.mutations === undefined) {
        initialMeanProportionInterval = { min: 0.05, max: 0.95 };
    }

    const lapisFilter = {
        ...(base.locationName && { locationName: base.locationName }),
        ...(base.samplingDate?.dateFrom && { samplingDateFrom: base.samplingDate.dateFrom }),
        ...(base.samplingDate?.dateTo && { samplingDateTo: base.samplingDate.dateTo }),
    };

    const memoizedMutationAnnotations = useMemo(() => JSON.stringify(resistanceMutationAnnotations), []);
    const memoizedLinkTemplate = useMemo(() => JSON.stringify(wastewaterConfig.wasap.linkTemplate), []);

    return (
        <gs-app
            lapis={wastewaterConfig.wasap.lapisBaseUrl}
            mutationAnnotations={memoizedMutationAnnotations}
            mutationLinkTemplate={memoizedLinkTemplate}
        >
            <div className='grid-cols-[300px_1fr] gap-x-4 lg:grid'>
                <div className='h-fit p-2 shadow-lg'>
                    <WasapPageStateSelector
                        pageStateHandler={pageStateHandler}
                        initialBaseFilterState={base}
                        initialAnalysisFilterState={analysis}
                    />
                </div>
                {isError ? (
                    <span>There was an error fetching the mutations to display.</span>
                ) : isPending ? (
                    <Loading />
                ) : (
                    <div className='h-full space-y-4 pr-4'>
                        {displayMutations !== undefined && displayMutations.length === 0 ? (
                            <NoDataHelperText analysisFilter={analysis} />
                        ) : (
                            <GsMutationsOverTime
                                lapisFilter={lapisFilter}
                                granularity={base.granularity as 'day' | 'week'}
                                lapisDateField={wastewaterConfig.wasap.samplingDateField}
                                sequenceType={analysis.sequenceType}
                                displayMutations={displayMutations}
                                pageSizes={[20, 50, 100, 250]}
                                useNewEndpoint={true}
                                initialMeanProportionInterval={initialMeanProportionInterval}
                                hideGaps={base.excludeEmpty ? true : undefined}
                                customColumns={customColumns}
                            />
                        )}
                        <WasapStats />
                    </div>
                )}
            </div>
        </gs-app>
    );
};

export const WasapPage = withQueryProvider(WasapPageInner);

/**
 * A note to the user to display when no mutations are selected due to the settings that they set in the filters.
 * The information is tailored to the mode and settings the user selected.
 */
const NoDataHelperText = ({ analysisFilter }: { analysisFilter: WasapAnalysisFilter }) => {
    return (
        <div className='rounded-md border-2 border-gray-100 p-4'>
            <h1 className='text-lg font-semibold'>No mutations selected</h1>
            {analysisFilter.mode === 'variant' && (
                <p className='text-sm'>
                    No mutations could be found matching your current filter settings. Try lowering filter thresholds or
                    looking at a different variant.
                </p>
            )}
            {analysisFilter.mode === 'untracked' &&
                analysisFilter.excludeSet === 'custom' &&
                (analysisFilter.excludeVariants === undefined || analysisFilter.excludeVariants.length === 0) && (
                    <p className='text-sm'>
                        Your set of variants to exclude is empty, please provide at least one variant to exclude.
                    </p>
                )}
        </div>
    );
};

const TotalCount = () => {
    const { data, isPending, isError, error } = useQuery({
        queryKey: ['aggregatedCount'],
        queryFn: () => getTotalCount(wastewaterConfig.wasap.lapisBaseUrl, {}),
    });

    return (
        <div className='stat'>
            <div className='stat-title'>Amplicon sequences</div>
            <div className='stat-value text-base'>{isPending ? '…' : isError ? 'Error' : data.toLocaleString()}</div>
            <div className='stat-desc text-wrap'>
                {isPending
                    ? 'Loading total amplicon sequences count…'
                    : isError
                      ? error.message
                      : 'The total number of amplicon sequences in all samples'}
            </div>
        </div>
    );
};

const DateRange = () => {
    const { data, isPending, isError, error } = useQuery({
        queryKey: ['dateRange'],
        queryFn: () => getDateRange(wastewaterConfig.wasap.lapisBaseUrl, wastewaterConfig.wasap.samplingDateField),
    });

    return (
        <div className='stat'>
            <div className='stat-title'>Sampling Dates</div>
            <div className='stat-value text-base'>
                {isPending ? '…' : isError ? 'Error' : `${data.start} to ${data.end}`}
            </div>
            <div className='stat-desc text-wrap'>
                {isPending
                    ? 'Loading date range…'
                    : isError
                      ? error.message
                      : 'The start and end dates of collected samples'}
            </div>
        </div>
    );
};

const WasapStats = () => (
    <div className='flex min-w-[180px] flex-col gap-4 rounded-md border-2 border-gray-100 sm:flex-row'>
        <TotalCount />
        <DateRange />
    </div>
);

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

/**
 * Takes the analysis settings and then returns a list of mutations that should be analysed,
 * based on the settings. can also return the string 'all', which means that everything should
 * be analysed, no specific selection.
 *
 * For some modes, additional data will be fetched to decide which mutations to analyse.
 */
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
            return { type: 'selected', mutations: RESISTANCE_MUTATIONS[analysis.resistanceSet] };
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

function getDisplayMutationsAndCustomColumns(
    mutationSelection: MutationSelection | undefined,
): [string[] | undefined, CustomColumn[] | undefined] {
    let displayMutations: string[] | undefined = undefined;
    let customColumns: CustomColumn[] | undefined = undefined;
    if (mutationSelection !== undefined) {
        switch (mutationSelection.type) {
            case 'all':
                break; // keep it as undefined
            case 'selected': {
                displayMutations = mutationSelection.mutations;
                break;
            }
            case 'jaccard': {
                displayMutations = mutationSelection.mutationsWithScore.map(({ mutation }) => mutation);
                customColumns = [
                    {
                        header: 'Jaccard index',
                        values: Object.fromEntries(
                            mutationSelection.mutationsWithScore.map(({ mutation, jaccardIndex }) => [
                                mutation,
                                jaccardIndex.toPrecision(2),
                            ]),
                        ),
                    },
                ];
                break;
            }
        }
    }
    return [displayMutations, customColumns];
}