import React from 'react';
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
                    displayMutations={pageState.mutations}
                    height='100%'
                    pageSizes={[20, 50, 100, 250]}
                />
            </div>
        </gs-app>
    );
};
