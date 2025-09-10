import { type SequenceType } from '@genspectrum/dashboard-components/util';
import React, { useEffect, useMemo, useState } from 'react';
import { type FC } from 'react';

import {
    RESISTANCE_MUTATIONS,
    resistanceMutationAannotations as resistanceMutationAnnotations,
} from './resistanceMutations';
import { wastewaterConfig } from '../../../types/wastewaterConfig';
import { WasapPageStateHandler } from '../../../views/pageStateHandlers/WasapPageStateHandler';
import { GsMutationsOverTime, type InitialMeanProportionInterval } from '../../genspectrum/GsMutationsOverTime';
import { WasapPageStateSelector } from '../../pageStateSelectors/WasapPageStateSelector';

export const COV_SPECTRUM_LAPIS = 'https://lapis.cov-spectrum.org/open/v2';

export type WasapPageProps = {
    currentUrl: URL;
};

export const WasapPage: FC<WasapPageProps> = ({ currentUrl }) => {
    const pageStateHandler = useMemo(() => new WasapPageStateHandler(), []);
    const pageState = useMemo(() => pageStateHandler.parsePageStateFromUrl(currentUrl), [pageStateHandler, currentUrl]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);
    const [variantMutations, setVariantMutations] = useState<string[]>([]);
    const [untrackedMutations, setUntrackedMutations] = useState<string[]>([]);

    useEffect(() => {
        if (pageState.analysisMode === 'variant' && pageState.variant) {
            setLoading(true);
            fetchMutations(
                COV_SPECTRUM_LAPIS,
                pageState.sequenceType,
                pageState.variant,
                pageState.minProportion,
                pageState.minCount,
            )
                .then(setVariantMutations)
                .catch((err: unknown) => setError(String(err)))
                .finally(() => setLoading(false));
        } else if (pageState.analysisMode === 'untracked' && pageState.excludeVariants !== undefined) {
            setLoading(true);
            Promise.all([
                Promise.all(
                    pageState.excludeVariants.map((variant) =>
                        fetchMutations(COV_SPECTRUM_LAPIS, 'nucleotide', variant, 0.05, 5),
                    ),
                ).then((r) => r.flat()),
                fetchMutations(wastewaterConfig.wasapLapisBaseUrl, 'nucleotide', undefined, 0.05, 5),
            ])
                .then(([excludeMutations, allMuts]) => {
                    setUntrackedMutations(allMuts.filter((m) => !excludeMutations.includes(m)));
                })
                .catch((err: unknown) => setError(String(err)))
                .finally(() => setLoading(false));
        }
    }, [
        pageState.analysisMode,
        pageState.sequenceType,
        pageState.variant,
        pageState.minProportion,
        pageState.minCount,
        pageState.excludeVariants,
    ]);

    const displayMutations = useMemo(() => {
        switch (pageState.analysisMode) {
            case 'manual':
                return pageState.mutations;
            case 'variant':
                return variantMutations;
            case 'resistance':
                return RESISTANCE_MUTATIONS[pageState.resistanceSet];
            case 'untracked':
                return untrackedMutations;
        }
    }, [pageState.analysisMode, pageState.mutations, variantMutations, untrackedMutations, pageState.resistanceSet]);

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

    return (
        <gs-app
            lapis={wastewaterConfig.wasapLapisBaseUrl}
            mutationAnnotations={JSON.stringify(resistanceMutationAnnotations)}
        >
            <div className='grid-cols-[300px_1fr] gap-x-4 lg:grid'>
                <div className='h-fit p-2 shadow-lg'>
                    <WasapPageStateSelector pageStateHandler={pageStateHandler} initialPageState={pageState} />
                </div>
                {error ? (
                    <span>{error}</span>
                ) : loading ? (
                    <span>Loading mutations to display ...</span>
                ) : (
                    <div className='h-full pr-4'>
                        <GsMutationsOverTime
                            lapisFilter={lapisFilter}
                            granularity={pageState.granularity as 'day' | 'week'}
                            lapisDateField='sampling_date'
                            sequenceType={pageState.sequenceType}
                            displayMutations={displayMutations}
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
    if (pangoLineage) params.pangoLineage = pangoLineage;

    url.search = new URLSearchParams(params).toString();

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

    const json: { data: { mutation: string; count: number }[] } = await res.json();

    return json.data.filter((item) => item.count >= minCount).map((item) => item.mutation);
}
