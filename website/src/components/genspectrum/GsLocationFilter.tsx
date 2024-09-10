import { useEffect, useRef } from 'react';

import '@genspectrum/dashboard-components';

export function GsLocationFilter<Field extends string>({
    onLocationChange = () => {},
    fields,
    placeholderText,
    width,
}: {
    width?: string;
    placeholderText?: string;
    fields: Field[];
    onLocationChange?: (location: { [key in Field]: string | undefined }) => void;
}) {
    const locationFilterRef = useRef<HTMLElement>();

    useEffect(() => {
        const handleLocationChange = (event: CustomEvent) => {
            onLocationChange(event.detail);
        };

        if (locationFilterRef.current) {
            locationFilterRef.current.addEventListener('gs-location-changed', handleLocationChange);
        }

        return () => {
            if (locationFilterRef.current) {
                locationFilterRef.current.removeEventListener('gs-location-changed', handleLocationChange);
            }
        };
    }, []);

    return (
        <gs-location-filter
            fields={JSON.stringify(fields)}
            placeholderText={placeholderText}
            width={width}
            ref={locationFilterRef}
        ></gs-location-filter>
    );
}
