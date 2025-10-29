import { type SequenceType } from '@genspectrum/dashboard-components/util';

import { RadioSelect } from './RadioSelect';

export function SequenceTypeSelector({
    value,
    onChange,
}: {
    value: SequenceType;
    onChange: (newType: SequenceType) => void;
}) {
    return (
        <RadioSelect
            label='Sequence type'
            value={value}
            options={[
                { value: 'nucleotide', label: 'Nucleotide' },
                { value: 'amino acid', label: 'Amino acid' },
            ]}
            onChange={onChange}
        />
    );
}
