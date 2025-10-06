import type { MeanProportionInterval } from '@genspectrum/dashboard-components/util';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { type FC } from 'react';

import { RESISTANCE_MUTATIONS, resistanceMutationAnnotations } from './resistanceMutations';
import { getCladeLineages } from '../../../lapis/getCladeLineages';
import { getDateRange } from '../../../lapis/getDateRange';
import { getMutations } from '../../../lapis/getMutations';
import { getTotalCount } from '../../../lapis/getTotalCount';
import { wastewaterConfig } from '../../../types/wastewaterConfig';
import { Loading } from '../../../util/Loading';
import {
    WasapPageStateHandler,
    type WasapAnalysisFilter,
} from '../../../views/pageStateHandlers/WasapPageStateHandler';
import { GsMutationsOverTime } from '../../genspectrum/GsMutationsOverTime';
import { WasapPageStateSelector } from '../../pageStateSelectors/WasapPageStateSelector';
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
        data: selectedMutations,
        isPending,
        isError,
    } = useQuery({
        queryKey: [base, analysis],
        queryFn: () => fetchMutationSelection(analysis),
    });

    let initialMeanProportionInterval: MeanProportionInterval = { min: 0.0, max: 1.0 };
    if (analysis.mode === 'manual' && analysis.mutations === undefined) {
        initialMeanProportionInterval = { min: 0.05, max: 0.95 };
    }

    const lapisFilter = {
        /* eslint-disable @typescript-eslint/naming-convention */
        ...(base.locationName && { location_name: base.locationName }),
        ...(base.samplingDate?.dateFrom && { sampling_dateFrom: base.samplingDate.dateFrom }),
        ...(base.samplingDate?.dateTo && { sampling_dateTo: base.samplingDate.dateTo }),
        /* eslint-enable @typescript-eslint/naming-convention */
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
                        <GsMutationsOverTime
                            lapisFilter={lapisFilter}
                            granularity={base.granularity as 'day' | 'week'}
                            lapisDateField={wastewaterConfig.wasap.samplingDateField}
                            sequenceType={analysis.sequenceType}
                            displayMutations={selectedMutations === 'all' ? undefined : selectedMutations}
                            pageSizes={[20, 50, 100, 250]}
                            useNewEndpoint={true}
                            initialMeanProportionInterval={initialMeanProportionInterval}
                            hideGaps={base.excludeEmpty ? true : undefined}
                        />
                        <WasapStats />
                    </div>
                )}
            </div>
        </gs-app>
    );
};

export const WasapPage = withQueryProvider(WasapPageInner);

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

/**
 * Takes the analysis settings and then returns a list of mutations that should be analysed,
 * based on the settings. can also return the string 'all', which means that everything should
 * be analysed, no specific selection.
 *
 * For some modes, additional data will be fetched to decide which mutations to analyse.
 */
async function fetchMutationSelection(analysis: WasapAnalysisFilter): Promise<string[] | 'all'> {
    switch (analysis.mode) {
        case 'manual':
            return analysis.mutations ?? 'all';
        case 'variant':
            if (!analysis.variant) {
                return [];
            }
            return getMutations(
                wastewaterConfig.wasap.covSpectrum.lapisBaseUrl,
                analysis.sequenceType,
                analysis.variant,
                analysis.minProportion,
                analysis.minCount,
            );
        case 'resistance':
            return RESISTANCE_MUTATIONS[analysis.resistanceSet];
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
                return [];
            }
            const [excludeMutations, allMuts] = await Promise.all([
                Promise.all(
                    variantsToExclude.map((v) =>
                        getMutations(
                            wastewaterConfig.wasap.covSpectrum.lapisBaseUrl,
                            analysis.sequenceType,
                            v,
                            0.05,
                            5,
                        ),
                    ),
                ).then((r) => r.flat()),
                getMutations(wastewaterConfig.wasap.lapisBaseUrl, analysis.sequenceType, undefined, 0.05, 5),
            ]);
            return allMuts.filter((m) => !excludeMutations.includes(m));
        }
    }
}
