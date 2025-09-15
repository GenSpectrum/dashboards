import { type SequenceType } from '@genspectrum/dashboard-components/util';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { type FC } from 'react';

import { RESISTANCE_MUTATIONS, resistanceMutationAnnotations } from './resistanceMutations';
import { wastewaterConfig } from '../../../types/wastewaterConfig';
import { type WasapFilter, WasapPageStateHandler } from '../../../views/pageStateHandlers/WasapPageStateHandler';
import { GsMutationsOverTime, type InitialMeanProportionInterval } from '../../genspectrum/GsMutationsOverTime';
import { WasapPageStateSelector } from '../../pageStateSelectors/WasapPageStateSelector';
import { withQueryProvider } from '../../subscriptions/backendApi/withQueryProvider';

export type WasapPageProps = {
    currentUrl: URL;
};

export const WasapPageInner: FC<WasapPageProps> = ({ currentUrl }) => {
    const pageStateHandler = useMemo(() => new WasapPageStateHandler(), []);
    const pageState = useMemo(() => pageStateHandler.parsePageStateFromUrl(currentUrl), [pageStateHandler, currentUrl]);

    const {
        data: displayMutations,
        isPending,
        isError,
    } = useQuery({
        queryKey: [pageState],
        queryFn: () => fetchDisplayMutations(pageState),
    });

    let initialMeanProportionInterval: InitialMeanProportionInterval = { min: 0.0, max: 1.0 };
    if (pageState.analysisMode === 'manual' && pageState.mutations === undefined) {
        initialMeanProportionInterval = { min: 0.05, max: 0.95 };
    }

    const lapisFilter = {
        /* eslint-disable @typescript-eslint/naming-convention */
        ...(pageState.locationName && { location_name: pageState.locationName }),
        ...(pageState.samplingDate?.dateFrom && { sampling_dateFrom: pageState.samplingDate.dateFrom }),
        ...(pageState.samplingDate?.dateTo && { sampling_dateTo: pageState.samplingDate.dateTo }),
        /* eslint-enable @typescript-eslint/naming-convention */
    };

    const memoizedMutationAnnotations = useMemo(
        () => JSON.stringify(resistanceMutationAnnotations),
        [resistanceMutationAnnotations],
    );

    return (
        <gs-app lapis={wastewaterConfig.wasapLapisBaseUrl} mutationAnnotations={memoizedMutationAnnotations}>
            <div className='grid-cols-[300px_1fr] gap-x-4 lg:grid'>
                <div className='h-fit p-2 shadow-lg'>
                    <WasapPageStateSelector pageStateHandler={pageStateHandler} initialPageState={pageState} />
                </div>
                {isError ? (
                    <span>There was an error fetching the mutations to display.</span>
                ) : isPending ? (
                    <span>Loading mutations to display ...</span>
                ) : (
                    <div className='h-full pr-4'>
                        <GsMutationsOverTime
                            lapisFilter={lapisFilter}
                            granularity={pageState.granularity as 'day' | 'week'}
                            lapisDateField='sampling_date'
                            sequenceType={pageState.sequenceType}
                            displayMutations={displayMutations === 'all' ? undefined : displayMutations}
                            pageSizes={[20, 50, 100, 250]}
                            useNewEndpoint={true}
                            initialMeanProportionInterval={initialMeanProportionInterval}
                            hideGaps={pageState.excludeEmpty ? true : undefined}
                        />
                    </div>
                )}
            </div>
        </gs-app>
    );
};

export const WasapPage = withQueryProvider(WasapPageInner);

async function fetchDisplayMutations({
    analysisMode,
    mutations,
    sequenceType,
    variant,
    minProportion,
    minCount,
    excludeVariants,
    resistanceSet,
}: WasapFilter): Promise<string[] | 'all'> {
    switch (analysisMode) {
        case 'manual':
            return mutations ?? 'all';
        case 'variant':
            if (!variant) {
                return [];
            }
            return fetchMutations(
                wastewaterConfig.covSpectrumLapisBaseUrl,
                sequenceType,
                variant,
                minProportion,
                minCount,
            );
        case 'resistance':
            return RESISTANCE_MUTATIONS[resistanceSet];
        case 'untracked': {
            if (!excludeVariants) {
                return [];
            }
            const [excludeMutations, allMuts] = await Promise.all([
                Promise.all(
                    excludeVariants.map((v) =>
                        fetchMutations(wastewaterConfig.covSpectrumLapisBaseUrl, 'nucleotide', v, 0.05, 5),
                    ),
                ).then((r) => r.flat()),
                fetchMutations(wastewaterConfig.wasapLapisBaseUrl, 'nucleotide', undefined, 0.05, 5),
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
