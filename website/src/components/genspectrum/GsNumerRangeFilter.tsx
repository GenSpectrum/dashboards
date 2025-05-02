import type { NumberRange } from '@genspectrum/dashboard-components/util';
import { useEffect, useRef } from 'react';
import '@genspectrum/dashboard-components/components';

export function GsNumerRangeFilter({
    lapisField,
    width,
    onNumberRangeChanged = () => {},
    value,
    sliderMin,
    sliderMax,
    sliderStep,
}: {
    lapisField: string;
    width?: string;
    onNumberRangeChanged?: (numberRange: NumberRange) => void;
    value?: NumberRange;
    sliderMin?: number;
    sliderMax?: number;
    sliderStep?: number;
}) {
    const numberRangeFilterRef = useRef<HTMLElement>();

    useEffect(() => {
        const handleNumberRangeFilterChange = (event: CustomEvent) => {
            onNumberRangeChanged(event.detail);
        };

        const currentInputRef = numberRangeFilterRef.current;
        if (currentInputRef !== undefined) {
            currentInputRef.addEventListener('gs-number-range-value-changed', handleNumberRangeFilterChange);
        }

        return () => {
            if (currentInputRef !== undefined) {
                currentInputRef.removeEventListener('gs-number-range-value-changed', handleNumberRangeFilterChange);
            }
        };
    }, [onNumberRangeChanged]);

    return (
        <gs-number-range-filter
            ref={numberRangeFilterRef}
            lapisField={lapisField}
            width={width}
            value={JSON.stringify(value ?? {})}
            sliderMin={sliderMin}
            sliderMax={sliderMax}
            sliderStep={sliderStep}
        ></gs-number-range-filter>
    );
}
