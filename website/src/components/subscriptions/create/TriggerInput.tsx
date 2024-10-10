import { useEffect, useState } from 'react';

import { BaselineInput } from './BaselineInput.tsx';
import { CountFilterInput } from './CountFilterInput.tsx';
import { DateWindowInput } from './DateWindowInput.tsx';
import { type TriggerType, TriggerTypeInput } from './TriggerTypeInput.tsx';
import { VariantInput } from './VariantInput.tsx';
import type { DateWindow } from '../../../types/DateWindow.ts';
import type { LapisFilter, Trigger } from '../../../types/Subscription.ts';

export function TriggerInput({
    onTriggerChange,
    onDateWindowChange,
}: {
    onTriggerChange: (value: Trigger) => void;
    onDateWindowChange: (value: DateWindow) => void;
}) {
    const [triggerType, setTriggerType] = useState<TriggerType>({
        type: 'count',
        count: 0,
    });

    const [countTriggerFilter, setCountTriggerFilter] = useState<{ filter: LapisFilter }>({
        filter: {},
    });

    const [proportionTriggerFilter, setProportionTriggerFilter] = useState<{
        numeratorFilter: LapisFilter;
        denominatorFilter: LapisFilter;
    }>({
        numeratorFilter: {},
        denominatorFilter: {},
    });

    useEffect(() => {
        if (triggerType.type === 'count') {
            onTriggerChange({ ...triggerType, ...countTriggerFilter });
        }
        if (triggerType.type === 'proportion') {
            onTriggerChange({ ...triggerType, ...proportionTriggerFilter });
        }
    }, [triggerType, countTriggerFilter, proportionTriggerFilter, onTriggerChange]);

    return (
        <div className='flex flex-col gap-4'>
            <TriggerTypeInput
                onTriggerTypeChange={(triggerType) => {
                    setTriggerType(triggerType);
                }}
            />

            <DateWindowInput
                onDateWindowChange={(dateWindow) => {
                    onDateWindowChange(dateWindow);
                }}
            />

            {triggerType.type === 'count' && (
                <CountFilterInput
                    onCountFilterChange={(filter) => {
                        setCountTriggerFilter({ filter });
                    }}
                />
            )}

            {triggerType.type === 'proportion' && (
                <ProportionTriggerFilterInput
                    onProportionTriggerFilterChange={(proportionTriggerFilter) => {
                        setProportionTriggerFilter(proportionTriggerFilter);
                    }}
                />
            )}
        </div>
    );
}

export function ProportionTriggerFilterInput({
    onProportionTriggerFilterChange,
}: {
    onProportionTriggerFilterChange: (value: { denominatorFilter: LapisFilter; numeratorFilter: LapisFilter }) => void;
}) {
    const [filter, setFilter] = useState<{ denominatorFilter: LapisFilter; numeratorFilter: LapisFilter }>({
        denominatorFilter: {},
        numeratorFilter: {},
    });

    useEffect(() => {
        onProportionTriggerFilterChange(filter);
    }, [filter, onProportionTriggerFilterChange]);

    return (
        <>
            <BaselineInput
                onBaselineChange={(baseline) => {
                    setFilter((prevState) => {
                        return {
                            numeratorFilter: { ...prevState.numeratorFilter, ...baseline },
                            denominatorFilter: baseline,
                        };
                    });
                }}
            />

            <VariantInput
                onVariantInputChange={(variantFilter) => {
                    setFilter((prevFilter) => {
                        return { ...prevFilter, numeratorFilter: { ...prevFilter.numeratorFilter, ...variantFilter } };
                    });
                }}
            />
        </>
    );
}
