import { InputLabel } from '../../../styles/input/InputLabel.tsx';
import type { LapisFilter } from '../../../types/Subscription.ts';
import { GsLocationFilter } from '../../genspectrum/GsLocationFilter.tsx';

export function CountFilterInput({ onCountFilterChange }: { onCountFilterChange: (filter: LapisFilter) => void }) {
    return (
        <InputLabel title='Filter' description='The filter for the subscription.'>
            <div className='w-full'>
                <GsLocationFilter
                    fields={['region', 'country']}
                    placeholderText='Location'
                    onLocationChange={(location) => {
                        onCountFilterChange(location);
                    }}
                />
            </div>
        </InputLabel>
    );
}
