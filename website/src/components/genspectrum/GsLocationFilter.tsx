import { useEffect, useRef } from 'react';

import '@genspectrum/dashboard-components/components';
import type { LapisLocation } from '../../views/helpers.ts';

export function GsLocationFilter<Field extends string>({
    onLocationChange = () => {},
    fields,
    placeholderText,
    width,
    value,
}: {
    width?: string;
    placeholderText?: string;
    fields: Field[];
    onLocationChange?: (location: { [key in Field]: string | undefined }) => void;
    value?: LapisLocation;
}) {
    const locationFilterRef = useRef<HTMLElement>(null);

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
            fields={fields}
            placeholderText={placeholderText}
            width={width}
            ref={locationFilterRef}
            value={JSON.stringify(value)}
        ></gs-location-filter>
    );
}
