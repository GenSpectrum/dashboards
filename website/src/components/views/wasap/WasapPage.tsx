import type { MeanProportionInterval } from '@genspectrum/dashboard-components/util';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { type FC } from 'react';

import { toMutationAnnotations } from './resistanceMutations';
import { getLapisFilterForTimeFrame, useWasapPageData } from './useWasapPageData';
import {
    variantTimeFrameLabel,
    type WasapAnalysisFilter,
    type WasapPageConfig,
    type WasapVariantFilter,
} from './wasapPageConfig';
import { getDateRange } from '../../../lapis/getDateRange';
import { getTotalCount } from '../../../lapis/getTotalCount';
import { wastewaterOrganismConfigs, type WastewaterOrganismName } from '../../../types/wastewaterConfig';
import { Loading } from '../../../util/Loading';
import { WasapPageStateHandler } from '../../../views/pageStateHandlers/WasapPageStateHandler';
import { GsMutationsOverTime } from '../../genspectrum/GsMutationsOverTime';
import { WasapPageStateSelector } from '../../pageStateSelectors/wasap/WasapPageStateSelector';
import { withQueryProvider } from '../../subscriptions/backendApi/withQueryProvider';

export type WasapPageProps = {
    wastewaterOrganism: WastewaterOrganismName;
    currentUrl: URL;
};

export const WasapPageInner: FC<WasapPageProps> = ({ wastewaterOrganism, currentUrl }) => {
    const config = wastewaterOrganismConfigs[wastewaterOrganism];
    // initialize page state from the URL
    const pageStateHandler = useMemo(() => new WasapPageStateHandler(config), [config]);
    const { base, analysis } = useMemo(
        () => pageStateHandler.parsePageStateFromUrl(currentUrl),
        [pageStateHandler, currentUrl],
    );

    // fetch which mutations should be analyzed
    const { data, isPending, isError } = useWasapPageData(config, analysis);
    const displayMutations = data?.displayMutations;
    const customColumns = data?.customColumns;

    let initialMeanProportionInterval: MeanProportionInterval = { min: 0.0, max: 1.0 };
    if (analysis.mode === 'manual' && analysis.mutations === undefined) {
        initialMeanProportionInterval = { min: 0.05, max: 0.95 };
    }

    const lapisFilter = {
        ...(base.locationName && { locationName: base.locationName }),
        ...(base.samplingDate?.dateFrom && { samplingDateFrom: base.samplingDate.dateFrom }),
        ...(base.samplingDate?.dateTo && { samplingDateTo: base.samplingDate.dateTo }),
    };

    const memoizedMutationAnnotations = useMemo(
        () =>
            JSON.stringify(
                config.resistanceAnalysisModeEnabled
                    ? config.resistanceMutationSets.flatMap((resistanceMutation) =>
                          toMutationAnnotations(resistanceMutation),
                      )
                    : [],
            ),
        [config],
    );
    const memoizedLinkTemplate = useMemo(() => JSON.stringify(config.linkTemplate), [config.linkTemplate]);

    return (
        <gs-app
            lapis={config.lapisBaseUrl}
            mutationAnnotations={memoizedMutationAnnotations}
            mutationLinkTemplate={memoizedLinkTemplate}
        >
            <div className='grid-cols-[300px_1fr] gap-x-4 lg:grid'>
                <div className='h-fit p-2 shadow-lg'>
                    <WasapPageStateSelector
                        config={config}
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
                        {displayMutations?.length === 0 ? (
                            <NoDataHelperText analysisFilter={analysis} />
                        ) : (
                            <GsMutationsOverTime
                                lapisFilter={lapisFilter}
                                granularity={base.granularity as 'day' | 'week'}
                                lapisDateField={config.samplingDateField}
                                sequenceType={analysis.sequenceType}
                                displayMutations={displayMutations}
                                pageSizes={[20, 50, 100, 250]}
                                useNewEndpoint={true}
                                initialMeanProportionInterval={initialMeanProportionInterval}
                                hideGaps={base.excludeEmpty ? true : undefined}
                                customColumns={customColumns}
                            />
                        )}
                        {analysis.mode === 'variant' && config.variantAnalysisModeEnabled && (
                            <VariantFetchInfo
                                analysis={analysis}
                                clinicalLapisBaseUrl={config.clinicalLapis.lapisBaseUrl}
                                clinicalLapisLineageField={config.clinicalLapis.lineageField}
                                clinicalLapisDateField={config.clinicalLapis.dateField}
                                warningThreshold={config.clinicalSequenceCountWarningThreshold}
                            />
                        )}
                        <WasapStats config={config} />
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

/**
 * Info stat about the amount of sequences used during the computation of the clinical variant signature.
 * Will also show a warning of the count is small.
 */
const VariantFetchInfo = ({
    analysis,
    clinicalLapisBaseUrl,
    clinicalLapisLineageField,
    clinicalLapisDateField,
    warningThreshold,
}: {
    analysis: WasapVariantFilter;
    clinicalLapisBaseUrl: string;
    clinicalLapisLineageField: string;
    clinicalLapisDateField: string;
    warningThreshold: number;
}) => {
    const lapisFilter = {
        ...getLapisFilterForTimeFrame(analysis.timeFrame, clinicalLapisDateField),
        [clinicalLapisLineageField]: analysis.variant,
    };

    const { data, isPending, isError, error } = useQuery({
        queryKey: ['variantFetchInfo'],
        queryFn: () => getTotalCount(clinicalLapisBaseUrl, lapisFilter),
    });

    const isHighlighted = data !== undefined && data < warningThreshold;

    let message = `The number of clinical sequences for ${analysis.variant}`;
    if (analysis.timeFrame !== 'all') {
        message += ` during the past ${variantTimeFrameLabel(analysis.timeFrame)}`;
    }
    if (isHighlighted) {
        message += '. Clinical signature calculation with this few sequences is not recommended.';
    }

    return (
        <div className='flex min-w-[180px] flex-col gap-4 rounded-md border-2 border-gray-100 sm:flex-row'>
            <div className='stat'>
                <div className='stat-title'>Clinical sequences for {analysis.variant}</div>
                <div className='stat-value text-base'>
                    {isPending ? (
                        '…'
                    ) : isError ? (
                        'Error'
                    ) : isHighlighted ? (
                        <span className='rounded bg-yellow-200 px-1 py-0.5'>{data.toLocaleString()}</span>
                    ) : (
                        data.toLocaleString()
                    )}
                </div>
                <div className='stat-desc text-wrap'>{isPending ? 'Loading …' : isError ? error.message : message}</div>
            </div>
        </div>
    );
};

const WasapStats = ({ config }: { config: WasapPageConfig }) => (
    <div className='flex min-w-[180px] flex-col gap-4 rounded-md border-2 border-gray-100 sm:flex-row'>
        <TotalCount config={config} />
        <DateRange config={config} />
    </div>
);

const TotalCount = ({ config }: { config: WasapPageConfig }) => {
    const { data, isPending, isError, error } = useQuery({
        queryKey: ['aggregatedCount'],
        queryFn: () => getTotalCount(config.lapisBaseUrl, {}),
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

const DateRange = ({ config }: { config: WasapPageConfig }) => {
    const { data, isPending, isError, error } = useQuery({
        queryKey: ['dateRange'],
        queryFn: () => getDateRange(config.lapisBaseUrl, config.samplingDateField),
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
