import type { LapisFilter } from '@genspectrum/dashboard-components/util';

import { GsTextInput } from '../genspectrum/GsTextInput.tsx';
import '@genspectrum/dashboard-components/components';
import type { LocationFilterConfig } from '../pageStateSelectors/BaselineSelector.tsx';

export function GsLocationFilter({
    onLocationChange = () => {},
    locationFilterConfig,
    lapisFilter,
}: {
    onLocationChange?: (locationFilterConfig: LocationFilterConfig) => void;
    locationFilterConfig: LocationFilterConfig;
    lapisFilter: LapisFilter;
}) {
    return locationFilterConfig.locationFields.map((field) => {
        return (
            <GsTextInput
                key={field}
                lapisField={field}
                lapisFilter={lapisFilter}
                placeholderText={field}
                initialValue={locationFilterConfig.initialLocation[field] ?? ''}
                onInputChange={(location) => {
                    const newLocationFilterConfig = {
                        ...locationFilterConfig,
                        initialLocation: {
                            ...locationFilterConfig.initialLocation,
                            ...location,
                        },
                    };

                    onLocationChange(newLocationFilterConfig);
                }}
            />
        );
    });
}
