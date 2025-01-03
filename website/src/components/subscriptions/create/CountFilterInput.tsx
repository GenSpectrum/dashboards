import type { LapisFilter } from '@genspectrum/dashboard-components/util';

import { InputLabel } from '../../../styles/input/InputLabel.tsx';
import { GsLocationFilter } from '../../genspectrum/GsLocationFilter.tsx';

export function CountFilterInput({ onCountFilterChange }: { onCountFilterChange: (filter: LapisFilter) => void }) {
    const locationFilterConfig = {
        locationFields: ['region', 'country'],
        initialLocation: {},
        placeholderText: 'Location',
    };

    return (
        <InputLabel title='Filter' description='The filter for the subscription.'>
            <div className='w-full'>
                <GsLocationFilter
                    locationFilterConfig={locationFilterConfig}
                    onLocationChange={(locationConfig) => {
                        onCountFilterChange(locationConfig.initialLocation);
                    }}
                    lapisFilter={{}}
                ></GsLocationFilter>
            </div>
        </InputLabel>
    );
}
