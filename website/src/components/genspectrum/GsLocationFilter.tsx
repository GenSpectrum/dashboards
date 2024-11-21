import { useEffect, useRef } from 'react';

import '@genspectrum/dashboard-components/components';

export function GsLocationFilter<Field extends string>({
    onLocationChange = () => {},
    fields,
    placeholderText,
    width,
    initialValue,
}: {
    width?: string;
    placeholderText?: string;
    fields: Field[];
    onLocationChange?: (location: { [key in Field]: string | undefined }) => void;
    initialValue?: string;
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
            width={width}
            ref={locationFilterRef}
            initialValue={initialValue}
        ></gs-location-filter>
    );
}
