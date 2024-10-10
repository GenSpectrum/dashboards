import { useEffect, useState } from 'react';

import { InputLabel } from '../../../styles/input/InputLabel.tsx';

export type TriggerType =
    | {
          count: number;
          type: 'count';
      }
    | {
          proportion: number;
          type: 'proportion';
      };

export function TriggerTypeInput({ onTriggerTypeChange }: { onTriggerTypeChange: (trigger: TriggerType) => void }) {
    const [triggerType, setTriggerType] = useState<TriggerType>({
        type: 'count',
        count: 0,
    });

    const [countTrigger, setCountTrigger] = useState({
        type: 'count' as const,
        count: 0,
    });
    const [proportionTrigger, setProportionTrigger] = useState({
        type: 'proportion' as const,
        proportion: 1.0,
    });

    const updateCountTrigger = (newCountTrigger: { count: number; type: 'count' }) => {
        setCountTrigger(newCountTrigger);
        setTriggerType(newCountTrigger);
    };

    const updateProportionTrigger = (newProportionTrigger: { proportion: number; type: 'proportion' }) => {
        setProportionTrigger(newProportionTrigger);
        setTriggerType(newProportionTrigger);
    };

    useEffect(() => {
        onTriggerTypeChange(triggerType);
    }, [triggerType, onTriggerTypeChange]);

    return (
        <InputLabel
            title='Threshold'
            description={
                'The threshold for the subscription. ' +
                `If the ${triggerType.type === 'count' ? 'count' : 'prevalence'} of the variant exceeds this threshold, ` +
                'you will receive a notification.'
            }
        >
            <div className='flex w-full'>
                <label className='w-full'>
                    <select
                        className='select select-bordered w-full'
                        onChange={(event) => {
                            const value = event.currentTarget.value;
                            if (value === 'count') {
                                setTriggerType(countTrigger);
                            }
                            if (value === 'proportion') {
                                setTriggerType(proportionTrigger);
                            }
                        }}
                        value={triggerType.type}
                    >
                        <option value='proportion'>Prevalence</option>
                        <option value='count'>Count</option>
                    </select>
                </label>
                {triggerType.type === 'count' && (
                    <label className='input input-bordered flex items-center gap-2'>
                        <input
                            type='number'
                            step={1}
                            min={0}
                            lang='en'
                            className='w-32 grow'
                            value={countTrigger.count}
                            onChange={(event) => {
                                const newCountTrigger = {
                                    ...countTrigger,
                                    count: parseInt(event.currentTarget.value, 10),
                                };
                                updateCountTrigger(newCountTrigger);
                            }}
                        />
                    </label>
                )}
                {triggerType.type === 'proportion' && (
                    <label className='input input-bordered flex items-center gap-2'>
                        <input
                            type='number'
                            step={0.1}
                            min={0}
                            max={100}
                            lang='en'
                            className='w-32 grow'
                            value={jsWorkaroundForFloatingPointConversionOfStrings(proportionTrigger.proportion)}
                            onChange={(event) => {
                                const newProportionTrigger = {
                                    ...proportionTrigger,
                                    proportion: parseFloat(event.currentTarget.value) / 100,
                                };
                                updateProportionTrigger(newProportionTrigger);
                            }}
                        />
                        %
                    </label>
                )}
            </div>
        </InputLabel>
    );
}

function jsWorkaroundForFloatingPointConversionOfStrings(ratio: number) {
    return parseFloat((ratio * 100).toFixed(3));
}
