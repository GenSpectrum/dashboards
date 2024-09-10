import type { LapisFilter } from '../../../types/Subscription.ts';
import { InputLabel } from '../../../styles/input/InputLabel.tsx';
import { GsLocationFilter } from '../../genspectrum/GsLocationFilter.tsx';

export function BaselineInput({ onBaselineChange }: { onBaselineChange: (baseline: LapisFilter) => void }) {
    return (
        <InputLabel
            title={'Baseline'}
            description={
                'Defines a general filter applied both to get the numerator and denominator value of the prevalence.'
            }
        >
            <div className='w-full'>
                <GsLocationFilter
                    fields={['region', 'country']}
                    placeholderText={'Baseline location'}
                    onLocationChange={(location) => {
                        onBaselineChange(location);
                    }}
                />
            </div>
        </InputLabel>
    );
}
