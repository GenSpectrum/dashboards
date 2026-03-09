import { type LapisFilter, views } from '@genspectrum/dashboard-components/util';
import type { FC } from 'react';

import { getSequencesByLocationMapData } from '../../util/getSequencesByLocationMapData';
import { defaultTablePageSize } from '../../views/View';
import { ComponentWrapper } from '../ComponentWrapper.tsx';

export type GsSequencesByLocationProps = {
    title: string;
    lapisLocationField: string;
    lapisFilter: LapisFilter;
    height?: string;
    mapName?: string;
    pageSize?: number;
};

export const GsSequencesByLocation: FC<GsSequencesByLocationProps> = ({
    title,
    height,
    lapisLocationField,
    lapisFilter,
    mapName,
    pageSize,
}) => {
    const mapData = getSequencesByLocationMapData(mapName, window.location.href);

    return (
        <ComponentWrapper title={title} height={height}>
            {mapData === undefined ? (
                <gs-sequences-by-location
                    key={mapName} // Force remount when mapName changes - otherwise React seems to set props to null that were set before which is invalid for the web component
                    lapisLocationField={lapisLocationField}
                    lapisFilter={lapisFilter}
                    pageSize={pageSize ?? defaultTablePageSize}
                    views={['table']}
                    width='100%'
                    height={height ? '100%' : undefined}
                />
            ) : (
                <gs-sequences-by-location
                    key={mapName}
                    lapisLocationField={lapisLocationField}
                    lapisFilter={lapisFilter}
                    pageSize={pageSize ?? defaultTablePageSize}
                    views={[views.map, views.table]}
                    mapSource={mapData.mapSource}
                    width='100%'
                    height={height ? '100%' : undefined}
                    zoom={mapData.zoom}
                    offsetX={mapData.offsetX}
                    offsetY={mapData.offsetY}
                    enableMapNavigation
                />
            )}
        </ComponentWrapper>
    );
};
