import { gsEventNames, type LapisFilter } from '@genspectrum/dashboard-components/util';
import { useEffect, useRef } from 'react';

import '@genspectrum/dashboard-components/components';

import type { LapisLocation } from '../../views/pageStateHandlers/locationFilterFromToUrl.ts';

export function GsLocationFilter<Field extends string>({
    onLocationChange = () => {},
    fields,
    placeholderText,
    lapisFilter,
    width,
    value,
}: {
    width?: string;
    placeholderText?: string;
    lapisFilter: LapisFilter;
    fields: Field[];
    onLocationChange?: (location: { [key in Field]: string | undefined }) => void;
    value?: LapisLocation;
}) {
    const locationFilterRef = useRef<HTMLElement>();

    useEffect(() => {
        const currentLocationFilterRef = locationFilterRef.current;
        if (!currentLocationFilterRef) {
            return;
        }
        const handleLocationChange = (event: CustomEvent) => {
            onLocationChange(event.detail);
        };

        currentLocationFilterRef.addEventListener(gsEventNames.locationChanged, handleLocationChange);

        return () => {
            currentLocationFilterRef.removeEventListener(gsEventNames.locationChanged, handleLocationChange);
        };
    }, [onLocationChange]);

    return (
        <gs-location-filter
            fields={JSON.stringify(fields)}
            placeholderText={placeholderText}
            lapisFilter={JSON.stringify(lapisFilter)}
            width={width}
            ref={locationFilterRef}
            value={JSON.stringify(value)}
        ></gs-location-filter>
    );
}
