import type { LapisFilter } from '@genspectrum/dashboard-components/util';

import { InputLabel } from '../../../styles/input/InputLabel.tsx';
import { GsLocationFilter } from '../../genspectrum/GsLocationFilter.tsx';

export function BaselineInput({ onBaselineChange }: { onBaselineChange: (baseline: LapisFilter) => void }) {
    const locationFilterConfig = {
        locationFields: ['region', 'country'],
        initialLocation: {},
        placeholderText: 'Location',
    };

    return (
        <InputLabel
            title='Baseline'
            description='Defines a general filter applied both to get the numerator and denominator value of the prevalence.'
        >
            <div className='w-full'>
                <GsLocationFilter
                    locationFilterConfig={locationFilterConfig}
                    onLocationChange={(locationConfig) => {
                        onBaselineChange(locationConfig.initialLocation);
                    }}
                    lapisFilter={{}}
                ></GsLocationFilter>
            </div>
        </InputLabel>
    );
}
