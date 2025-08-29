import { type SequenceType } from '@genspectrum/dashboard-components/util';
import React, { useEffect, useState } from 'react';
import { type FC } from 'react';

import { wastewaterConfig } from '../../../types/wastewaterConfig';
import { WasapPageStateHandler } from '../../../views/pageStateHandlers/WasapPageStateHandler';
import { GsMutationsOverTime } from '../../genspectrum/GsMutationsOverTime';
import { WasapPageStateSelector } from '../../pageStateSelectors/WasapPageStateSelector';

export type WasapPageProps = {
    currentUrl: URL;
};

export const WasapPage: FC<WasapPageProps> = ({ currentUrl }) => {
    const pageStateHandler = new WasapPageStateHandler();
    const pageState = pageStateHandler.parsePageStateFromUrl(currentUrl);

    const [variantMutations, setVariantMutations] = useState<string[] | null>(null);

    useEffect(() => {
        if (pageState.analysisMode === 'variant') {
            fetchMutations(pageState.sequenceType, "B.1.1.7", 0.05)
                .then(setVariantMutations)
                .catch(console.error);
        }
    }, [pageState.analysisMode, pageState.sequenceType]);

    const displayMutations =
    pageState.analysisMode === 'manual'
        ? pageState.mutations
        : variantMutations;

    if (pageState.analysisMode === 'variant' && variantMutations === null) {
        return <div>Loading mutations…</div>;
    }

    const lapisFilter = {
        /* eslint-disable @typescript-eslint/naming-convention */
        ...(pageState.locationName && { location_name: pageState.locationName }),
        ...(pageState.samplingDate?.dateFrom && { sampling_dateFrom: pageState.samplingDate.dateFrom }),
        ...(pageState.samplingDate?.dateTo && { sampling_dateTo: pageState.samplingDate.dateTo }),
        /* eslint-enable @typescript-eslint/naming-convention */
    };

    return (
        <gs-app lapis={wastewaterConfig.wasapLapisBaseUrl}>
            <div className='grid-cols-[300px_1fr] gap-x-4 lg:grid'>
                <div className='h-fit p-2 shadow-lg'>
                    <WasapPageStateSelector pageStateHandler={pageStateHandler} initialPageState={pageState} />
                </div>
                <GsMutationsOverTime
                    lapisFilter={lapisFilter}
                    granularity='week'
                    lapisDateField='sampling_date'
                    sequenceType={pageState.sequenceType}
                    displayMutations={displayMutations}
                    height='100%'
                    pageSizes={[20, 50, 100, 250]}
                />
            </div>
        </gs-app>
    );
};

async function fetchMutations(
    mutationType: SequenceType,
    pangoLineage: string,
    minProportion: number
): Promise<string[]> {
    const endpoint =
        mutationType === "nucleotide"
            ? "nucleotideMutations"
            : "aminoAcidMutations";

    const url = `https://lapis.cov-spectrum.org/open/v2/sample/${endpoint}?pangoLineage=${encodeURIComponent(
        pangoLineage
    )}&minProportion=${minProportion}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();

    return json.data.map((item: { mutation: string }) => item.mutation);
}