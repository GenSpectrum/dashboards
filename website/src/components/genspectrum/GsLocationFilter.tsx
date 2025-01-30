import type { LapisFilter } from '@genspectrum/dashboard-components/util';
import { useEffect, useRef } from 'react';

import '@genspectrum/dashboard-components/components';
import type { LapisLocation } from '../../views/helpers.ts';

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
        const handleLocationChange = (event: CustomEvent) => {
            onLocationChange(event.detail);
        };

        const currentLocationFilterRef = locationFilterRef.current;
        if (currentLocationFilterRef) {
            currentLocationFilterRef.addEventListener('gs-location-changed', handleLocationChange);
        }

        return () => {
            if (currentLocationFilterRef) {
                currentLocationFilterRef.removeEventListener('gs-location-changed', handleLocationChange);
            }
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
