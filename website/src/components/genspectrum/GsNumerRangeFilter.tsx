import {
    gsEventNames,
    type NumberRangeFilterChangedEvent,
    type NumberRangeValueChangedEvent,
    type LapisNumberFilter,
    type NumberRange,
} from '@genspectrum/dashboard-components/util';
import { useEffect, useRef } from 'react';
import '@genspectrum/dashboard-components/components';

export function GsNumerRangeFilter({
    lapisField,
    width,
    onNumberRangeChanged = () => {},
    onLapisFilterChanged = () => {},
    value,
    sliderMin,
    sliderMax,
    sliderStep,
}: {
    lapisField: string;
    width?: string;
    onNumberRangeChanged?: (numberRange: NumberRange) => void;
    onLapisFilterChanged?: (lapisFilter: LapisNumberFilter) => void;
    value?: NumberRange;
    sliderMin?: number;
    sliderMax?: number;
    sliderStep?: number;
}) {
    const numberRangeFilterRef = useRef<HTMLElement>();

    useEffect(() => {
        const currentInputRef = numberRangeFilterRef.current;
        if (currentInputRef === undefined) {
            return;
        }

        const handleNumberRangeFilterChange = (event: NumberRangeValueChangedEvent) => {
            onNumberRangeChanged(event.detail);
        };

        const handleLapisFilterChange = (event: NumberRangeFilterChangedEvent) => {
            onLapisFilterChanged(event.detail);
        };

        currentInputRef.addEventListener(gsEventNames.numberRangeValueChanged, handleNumberRangeFilterChange);
        currentInputRef.addEventListener(gsEventNames.numberRangeFilterChanged, handleLapisFilterChange);

        return () => {
            currentInputRef.removeEventListener(gsEventNames.numberRangeValueChanged, handleNumberRangeFilterChange);
            currentInputRef.removeEventListener(gsEventNames.numberRangeFilterChanged, handleLapisFilterChange);
        };
    }, [onLapisFilterChanged, onNumberRangeChanged]);

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
