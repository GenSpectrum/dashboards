import { type SequenceType } from '@genspectrum/dashboard-components/util';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { type FC } from 'react';

import { RESISTANCE_MUTATIONS, resistanceMutationAnnotations } from './resistanceMutations';
import { wastewaterConfig } from '../../../types/wastewaterConfig';
import { Loading } from '../../../util/Loading';
import {
    WasapPageStateHandler,
    type WasapAnalysisFilter,
} from '../../../views/pageStateHandlers/WasapPageStateHandler';
import { GsMutationsOverTime, type InitialMeanProportionInterval } from '../../genspectrum/GsMutationsOverTime';
import { WasapPageStateSelector } from '../../pageStateSelectors/WasapPageStateSelector';
import { withQueryProvider } from '../../subscriptions/backendApi/withQueryProvider';

export type WasapPageProps = {
    currentUrl: URL;
};

export const WasapPageInner: FC<WasapPageProps> = ({ currentUrl }) => {
    const pageStateHandler = useMemo(() => new WasapPageStateHandler(), []);
    const { base, analysis } = useMemo(
        () => pageStateHandler.parsePageStateFromUrl(currentUrl),
        [pageStateHandler, currentUrl],
    );

    const {
        data: displayMutations,
        isPending,
        isError,
    } = useQuery({
        queryKey: [base, analysis],
        queryFn: () => fetchDisplayMutations(analysis),
    });

    let initialMeanProportionInterval: InitialMeanProportionInterval = { min: 0.0, max: 1.0 };
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

    return (
        <gs-app lapis={wastewaterConfig.wasapLapisBaseUrl} mutationAnnotations={memoizedMutationAnnotations}>
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
                    <div className='h-full pr-4'>
                        <GsMutationsOverTime
                            lapisFilter={lapisFilter}
                            granularity={base.granularity as 'day' | 'week'}
                            lapisDateField='sampling_date'
                            sequenceType={analysis.sequenceType}
                            displayMutations={displayMutations === 'all' ? undefined : displayMutations}
                            pageSizes={[20, 50, 100, 250]}
                            useNewEndpoint={true}
                            initialMeanProportionInterval={initialMeanProportionInterval}
                            hideGaps={base.excludeEmpty ? true : undefined}
                        />
                    </div>
                )}
            </div>
        </gs-app>
    );
};

export const WasapPage = withQueryProvider(WasapPageInner);

async function fetchDisplayMutations(analysis: WasapAnalysisFilter): Promise<string[] | 'all'> {
    switch (analysis.mode) {
        case 'manual':
            return analysis.mutations ?? 'all';
        case 'variant':
            if (!analysis.variant) {
                return [];
            }
            return fetchMutations(
                wastewaterConfig.covSpectrumLapisBaseUrl,
                analysis.sequenceType,
                analysis.variant,
                analysis.minProportion,
                analysis.minCount,
            );
        case 'resistance':
            return RESISTANCE_MUTATIONS[analysis.resistanceSet];
        case 'untracked': {
            if (!analysis.excludeVariants) {
                return [];
            }
            const [excludeMutations, allMuts] = await Promise.all([
                Promise.all(
                    analysis.excludeVariants.map((v) =>
                        fetchMutations(wastewaterConfig.covSpectrumLapisBaseUrl, analysis.sequenceType, v, 0.05, 5),
                    ),
                ).then((r) => r.flat()),
                fetchMutations(wastewaterConfig.wasapLapisBaseUrl, analysis.sequenceType, undefined, 0.05, 5),
            ]);
            return allMuts.filter((m) => !excludeMutations.includes(m));
        }
    }
}

async function fetchMutations(
    baseUrl: string,
    mutationType: SequenceType,
    pangoLineage: string | undefined,
    minProportion: number,
    minCount: number,
): Promise<string[]> {
    const endpoint = mutationType === 'nucleotide' ? 'nucleotideMutations' : 'aminoAcidMutations';

    const url = new URL(`${baseUrl.replace(/\/$/, '')}/sample/${endpoint}`);
    const params: Record<string, string> = {
        minProportion: minProportion.toString(),
    };
    if (pangoLineage !== undefined) {
        params.pangoLineage = pangoLineage;
    }

    url.search = new URLSearchParams(params).toString();

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

    const json: { data: { mutation: string; count: number }[] } = await res.json();

    return json.data.filter((item) => item.count >= minCount).map((item) => item.mutation);
}
