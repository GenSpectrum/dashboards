import type { Channel } from '../../../types/NotificationChannels.ts';
import { useEffect, useState } from 'react';
import { DividerList } from '../../../styles/containers/DividerList.tsx';

export function ChannelsInput({
    label,
    channels,
    onChannelsSelect,
}: {
    label: string;
    channels: Channel[];
    onChannelsSelect: (value: string[]) => void;
}) {
    const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

    useEffect(() => {
        onChannelsSelect(selectedChannels);
    }, [selectedChannels]);

    return (
        <div className='flex flex-col gap-4'>
            <div className='flex items-center gap-2'>
                <div className='iconify mdi--slack'></div>
                <div>{label}</div>
            </div>

            <div>
                <DividerList>
                    {channels.map((channel) => (
                        <ChannelInput
                            key={channel.id}
                            label={channel.name}
                            onSelect={(isSelected) => {
                                const updatedSelectedChannels = isSelected
                                    ? [...selectedChannels, channel.id]
                                    : selectedChannels.filter((id) => id !== channel.id);
                                setSelectedChannels(updatedSelectedChannels);
                            }}
                        />
                    ))}
                </DividerList>
            </div>
        </div>
    );
}

function ChannelInput({ label, onSelect }: { label: string; onSelect: (value: boolean) => void }) {
    return (
        <label className='flex items-center gap-2'>
            <input
                type='checkbox'
                className='checkbox'
                onChange={(event) => {
                    const checked = event.currentTarget.checked;
                    onSelect(checked);
                }}
            />
            <div className='min-w-32 flex-1 truncate'>{label}</div>
        </label>
    );
}
